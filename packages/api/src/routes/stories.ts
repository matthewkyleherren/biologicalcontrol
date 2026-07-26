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

    const predeterminedId = `community.text.${user.id.replace(/-/g, '').slice(0, 12)}.${Date.now().toString(36)}`
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
