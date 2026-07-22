import {eq} from 'drizzle-orm'
import {Hono} from 'hono'
import type {Database} from '@biologicalcontrol/db'
import {users, voiceStoryDrafts} from '@biologicalcontrol/db'
import {
  createVoiceDraftBodySchema,
  submitVoiceDraftBodySchema,
} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {enqueueJob} from '../jobs/enqueue'

export function voiceRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.post('/voice-drafts', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createVoiceDraftBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)

    await db
      .update(users)
      .set({voiceConsentAt: new Date(), updatedAt: new Date()})
      .where(eq(users.id, user.id))

    const [draft] = await db
      .insert(voiceStoryDrafts)
      .values({
        userId: user.id,
        audioR2Key: body.audioR2Key,
        audioDurationMs: body.audioDurationMs,
        languageHint: body.languageHint,
        consentRecordedAt: new Date(),
        transcriptStatus: 'pending',
        status: 'processing',
      })
      .returning()

    await enqueueJob(db, {
      type: 'transcribe',
      subjectType: 'voice_story_draft',
      subjectId: draft!.id,
      provider: 'deepgram',
      inngestEventKey: c.get('env').INNGEST_EVENT_KEY,
    })

    return c.json({draft}, 201)
  })

  app.get('/voice-drafts/:id', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const draft = await db.query.voiceStoryDrafts.findFirst({
      where: eq(voiceStoryDrafts.id, c.req.param('id')),
    })
    if (!draft || draft.userId !== user.id) {
      return c.json({error: 'Not found'}, 404)
    }
    return c.json({draft})
  })

  app.post('/voice-drafts/:id/submit', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = submitVoiceDraftBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)
    const draft = await db.query.voiceStoryDrafts.findFirst({
      where: eq(voiceStoryDrafts.id, c.req.param('id')),
    })
    if (!draft || draft.userId !== user.id) {
      return c.json({error: 'Not found'}, 404)
    }

    const [updated] = await db
      .update(voiceStoryDrafts)
      .set({
        title: body.title,
        transcriptEdited: body.transcriptEdited,
        sanityPersonIds: body.sanityPersonIds,
        publishAudio: body.publishAudio,
        year: body.year,
        status: 'submitted',
        updatedAt: new Date(),
      })
      .where(eq(voiceStoryDrafts.id, draft.id))
      .returning()

    await enqueueJob(db, {
      type: 'publish_story',
      subjectType: 'voice_story_draft',
      subjectId: draft.id,
      provider: 'sanity',
      inngestEventKey: c.get('env').INNGEST_EVENT_KEY,
    })

    return c.json({draft: updated})
  })

  return app
}
