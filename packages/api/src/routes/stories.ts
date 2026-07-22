import {Hono} from 'hono'
import type {Database} from '@biologicalcontrol/db'
import {createStoryDraftBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {sanityMutate} from '../services/sanity'

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

    const doc = {
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
      // Draft until an editor promotes — Sanity create is still a document;
      // mark with era/note so Studio can filter if needed.
      era: 'community-submission',
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

    const sanityStoryId = result.data.results?.[0]?.id ?? null
    return c.json(
      {
        ok: true,
        sanityStoryId,
        message: 'Draft received. An editor will review it before it appears on the site.',
      },
      201
    )
  })

  return app
}
