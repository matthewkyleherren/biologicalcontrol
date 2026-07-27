import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {createStoryDraftBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {sanityMutate} from '../services/sanity'
import {sanityQuery} from '../services/sanity-query'

const reviewBodySchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
})

type MyStory = {
  _id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  year: number | null
  location: string | null
  reviewStatus: string | null
  createdAt: string | null
}

type PendingStory = {
  _id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  year: number | null
  location: string | null
  era: string | null
  reviewStatus: string | null
  createdAt: string | null
  bodyText: string | null
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export function storiesRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.post('/stories/drafts', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createStoryDraftBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)
    const env = c.get('env')

    const slug = `${slugify(body.title) || 'submission'}-${Date.now().toString(36)}`
    const people = body.sanityPersonIds.map((id) => ({
      _type: 'reference',
      _ref: id,
      _key: id.slice(0, 12),
    }))

    // Hyphens, never dots. A dot in a Sanity `_id` makes it a *path*, and public read only
    // covers the root path — the same mechanism that hides `drafts.`. Dotted ids meant every
    // community submission stayed invisible to anonymous readers even after an editor approved
    // it, so approved stories never reached the website or the app. Keep the id deterministic
    // so a retried mutate cannot spawn a duplicate.
    const predeterminedId = `community-text-${user.id.replace(/-/g, '').slice(0, 12)}-${Date.now().toString(36)}`
    const doc = {
      _id: predeterminedId,
      _type: 'story',
      title: body.title,
      slug: {_type: 'slug', current: slug},
      excerpt: body.body.slice(0, 240),
      year: body.year,
      location: body.location,
      people: people.length ? people : undefined,
      body: [
        {
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', text: body.body}],
        },
      ],
      publishedAt: new Date().toISOString(),
      era: 'community-submission',
      reviewStatus: 'pending',
      // Who told it. Plain fields rather than a `person` reference on purpose: the account is
      // the identity. Requiring a Sanity `person` document to be "claimed" before a story could
      // belong to anyone was a second identity system bolted onto Clerk, and it stranded every
      // story whose author had not claimed a name.
      submittedByUserId: user.id,
      submittedByName: user.displayName ?? null,
    }

    const result = await sanityMutate(env, [{create: doc}])
    if (!result.ok) {
      if (result.reason === 'unconfigured') {
        return c.json(
          {
            queued: true,
            message:
              'Thanks — saved against your account. Add SANITY_API_WRITE_TOKEN to publish drafts into Studio.',
            userId: user.id,
          },
          202
        )
      }
      return c.json({error: 'Could not save to Sanity'}, 500)
    }

    const sanityStoryId = result.data.results?.[0]?.id ?? predeterminedId
    return c.json(
      {
        ok: true,
        sanityStoryId,
        reviewStatus: 'pending',
        message: 'Sent for review. Approve it in Review before it appears in the public archive.',
      },
      201
    )
  })

  /**
   * The caller's own stories, whatever their review state.
   *
   * Without this, submitting a story was a dead end: it vanished into a queue only an editor
   * could see, with no way for the person who told it to find out whether it had arrived, been
   * published, or been turned down. "Lost in the middle of nowhere" was the exact complaint.
   *
   * Matches on `submittedByUserId`, so it works for anyone with an account and needs no Sanity
   * `person` document and no claiming.
   */
  app.get('/stories/mine', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)

    const result = await sanityQuery<MyStory[]>(
      c.get('env'),
      `*[_type == "story" && submittedByUserId == $userId] | order(_createdAt desc){
        _id, title, "slug": slug.current, excerpt, year, location, reviewStatus,
        "createdAt": _createdAt
      }`,
      {userId: user.id}
    )

    if (!result.ok) {
      if (result.reason === 'unconfigured') {
        return c.json({error: 'Sanity is not configured'}, 503)
      }
      return c.json({error: 'Could not load your stories'}, 500)
    }

    return c.json({stories: result.result ?? []})
  })

  /**
   * One-shot repair for stories stranded behind a dotted document id.
   *
   * Until this was fixed, submissions were created with ids like `community.text.ab12.xyz`.
   * A dot makes a Sanity `_id` a *path*, and anonymous read only covers the root path — the
   * same rule that hides `drafts.`. So community stories were invisible to the public site and
   * the app even once an editor approved them. This copies each stranded document to the same
   * id with hyphens, preserving every field, then removes the original.
   *
   * Admin only, and idempotent: running it twice is harmless because the second run finds
   * nothing left to move.
   */
  app.post('/stories/repair-ids', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    if (user.role !== 'admin') return c.json({error: 'Admin role required'}, 403)

    const found = await sanityQuery<Array<Record<string, unknown>>>(
      c.get('env'),
      `*[_type == "story" && _id match "community.*" && !(_id in path("drafts.**"))]`
    )
    if (!found.ok) return c.json({error: 'Could not read stories'}, 500)

    const stranded = (found.result ?? []).filter((doc) => String(doc._id ?? '').includes('.'))
    if (!stranded.length) return c.json({moved: [], message: 'Nothing to repair.'})

    const moved: Array<{from: string; to: string}> = []
    const mutations = []
    for (const doc of stranded) {
      const from = String(doc._id)
      const to = from.replace(/\./g, '-')
      // Copy every field except the ones Sanity owns, so nothing about the story changes
      // except where it lives.
      const {_id, _rev, _createdAt, _updatedAt, ...rest} = doc
      void _id
      void _rev
      void _createdAt
      void _updatedAt
      mutations.push({createOrReplace: {...rest, _id: to, _type: 'story'}})
      moved.push({from, to})
    }
    // Delete the originals only after the copies are written, and in the same transaction, so
    // a failure cannot leave a story existing nowhere.
    for (const {from} of moved) {
      mutations.push({delete: {id: from}})
    }

    const result = await sanityMutate(c.get('env'), mutations)
    if (!result.ok) return c.json({error: 'Could not repair ids', detail: result}, 500)

    return c.json({moved, count: moved.length})
  })

  app.get('/stories/pending', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    if (user.role !== 'editor' && user.role !== 'admin') {
      return c.json({error: 'Editor role required'}, 403)
    }

    const result = await sanityQuery<PendingStory[]>(
      c.get('env'),
      `*[_type == "story" && reviewStatus == "pending"] | order(_createdAt desc){
        _id, title, "slug": slug.current, excerpt, year, location, era, reviewStatus,
        "createdAt": _createdAt,
        "bodyText": pt::text(body)
      }`
    )

    if (!result.ok) {
      if (result.reason === 'unconfigured') {
        return c.json({error: 'Sanity is not configured'}, 503)
      }
      return c.json({error: 'Could not load pending stories'}, 500)
    }

    return c.json({stories: result.result ?? []})
  })

  app.patch('/stories/:id/review', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    if (user.role !== 'editor' && user.role !== 'admin') {
      return c.json({error: 'Editor role required'}, 403)
    }

    const body = reviewBodySchema.parse(await c.req.json())
    const id = c.req.param('id')
    const patch: Record<string, unknown> = {
      reviewStatus: body.status,
    }
    if (body.status === 'approved') {
      patch.publishedAt = new Date().toISOString()
    }

    const result = await sanityMutate(c.get('env'), [
      {
        patch: {
          id,
          set: patch,
        },
      },
    ])

    if (!result.ok) {
      if (result.reason === 'unconfigured') {
        return c.json({error: 'Sanity is not configured'}, 503)
      }
      return c.json({error: 'Could not update review status'}, 500)
    }

    return c.json({ok: true, id, reviewStatus: body.status})
  })

  return app
}
