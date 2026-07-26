import {eq} from 'drizzle-orm'
import {Hono} from 'hono'
import {Buffer} from 'node:buffer'
import {randomUUID} from 'node:crypto'
import type {Database} from '@biologicalcontrol/db'
import {users, voiceStoryDrafts} from '@biologicalcontrol/db'
import {
  createVoiceDraftBodySchema,
  createVoiceDraftDirectBodySchema,
  submitVoiceDraftBodySchema,
} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {enqueueJob} from '../jobs/enqueue'
import {transcribeAudioFromUrl} from '../services/deepgram'

const MAX_DIRECT_AUDIO_BYTES = 20 * 1024 * 1024

function extensionFromContentType(contentType: string) {
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
  }
  return map[contentType.split(';')[0]?.toLowerCase() ?? ''] ?? 'webm'
}

function decodeBase64Audio(audioBase64: string): ArrayBuffer {
  const normalized = audioBase64
    .replace(/^data:[^;]+;base64,/i, '')
    .replace(/\s/g, '')
  const bytes = Buffer.from(normalized, 'base64')
  if (!bytes.byteLength) {
    throw new Error('Audio is empty')
  }
  if (bytes.byteLength > MAX_DIRECT_AUDIO_BYTES) {
    throw new Error('Audio is too large for direct upload')
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

export function voiceRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.post('/voice-drafts', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createVoiceDraftBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)
    const env = c.get('env')

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
      inngestEventKey: env.INNGEST_EVENT_KEY,
      env,
    })

    const freshDraft = await db.query.voiceStoryDrafts.findFirst({
      where: eq(voiceStoryDrafts.id, draft!.id),
    })

    return c.json({draft: freshDraft ?? draft}, 201)
  })

  app.post('/voice-drafts/direct', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const env = c.get('env')
    if (!env.DEEPGRAM_API_KEY) {
      return c.json({error: 'DEEPGRAM_API_KEY is required for direct voice drafts'}, 503)
    }

    const body = createVoiceDraftDirectBodySchema.parse(await c.req.json())
    let audioBytes: ArrayBuffer
    try {
      audioBytes = decodeBase64Audio(body.audioBase64)
    } catch (err) {
      return c.json({error: err instanceof Error ? err.message : 'Invalid audio'}, 400)
    }

    let transcription
    try {
      transcription = await transcribeAudioFromUrl(
        env.DEEPGRAM_API_KEY,
        audioBytes,
        body.languageHint,
        body.contentType
      )
    } catch (err) {
      console.error('[voice-drafts/direct] deepgram failed', err)
      return c.json(
        {
          error:
            err instanceof Error
              ? err.message.slice(0, 300)
              : 'Transcription failed. Check DEEPGRAM_API_KEY on the server.',
        },
        502
      )
    }
    const transcriptRaw = transcription.transcript.trim()
    if (!transcriptRaw) {
      return c.json(
        {
          error:
            'We could not hear any words in that recording. Tap to record again, speak a little closer to the phone, then stop.',
        },
        422
      )
    }

    const user = await ensureAppUser(db, auth)
    const now = new Date()

    await db
      .update(users)
      .set({voiceConsentAt: now, updatedAt: now})
      .where(eq(users.id, user.id))

    const [draft] = await db
      .insert(voiceStoryDrafts)
      .values({
        userId: user.id,
        audioR2Key: `unstored/${randomUUID()}.${extensionFromContentType(body.contentType)}`,
        audioDurationMs: body.audioDurationMs,
        languageHint: body.languageHint,
        consentRecordedAt: now,
        transcriptRaw,
        transcriptEdited: transcriptRaw,
        transcriptStatus: 'ready',
        status: 'review',
        publishAudio: false,
      })
      .returning()

    if (env.OPENROUTER_API_KEY || env.OPENAI_API_KEY) {
      await enqueueJob(db, {
        type: 'clarity_edit',
        subjectType: 'voice_story_draft',
        subjectId: draft!.id,
        provider: env.OPENROUTER_API_KEY ? 'openrouter' : 'openai',
        inngestEventKey: env.INNGEST_EVENT_KEY,
        env,
      })
    }

    const freshDraft = await db.query.voiceStoryDrafts.findFirst({
      where: eq(voiceStoryDrafts.id, draft!.id),
    })

    return c.json({draft: freshDraft ?? draft}, 201)
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
        location: body.location,
        yearText: body.yearText,
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
      env: c.get('env'),
    })

    return c.json({draft: updated})
  })

  return app
}
