import {eq, sql} from 'drizzle-orm'
import type {Database} from '@biologicalcontrol/db'
import {processingJobs, voiceStoryDrafts} from '@biologicalcontrol/db'
import type {ApiEnv} from '../env'
import {clarityEditTranscript} from '../services/clarity-edit'
import {transcribeAudioFromUrl} from '../services/deepgram'
import {sanityMutate} from '../services/sanity'
import {downloadStorageBytes, getReadableUrl} from '../services/storage-read'
import {enqueueJob} from './enqueue'

type ProcessResult = Record<string, unknown>

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function truncateError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return message.slice(0, 2000)
}

function portableTextFromPlainText(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (paragraphs.length ? paragraphs : [text]).map((paragraph) => ({
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', text: paragraph}],
  }))
}

async function markVoiceDraftTranscribeFailed(
  db: Database,
  subjectType: string,
  subjectId: string,
  error: string
) {
  if (subjectType !== 'voice_story_draft') return
  await db
    .update(voiceStoryDrafts)
    .set({
      transcriptStatus: 'failed',
      transcriptRaw: error,
      updatedAt: new Date(),
    })
    .where(eq(voiceStoryDrafts.id, subjectId))
}

async function processTranscribe(
  db: Database,
  env: ApiEnv,
  subjectId: string
): Promise<ProcessResult> {
  if (!env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY is required to transcribe voice story drafts')
  }

  const draft = await db.query.voiceStoryDrafts.findFirst({
    where: eq(voiceStoryDrafts.id, subjectId),
  })
  if (!draft) throw new Error(`Voice story draft not found: ${subjectId}`)

  await db
    .update(voiceStoryDrafts)
    .set({
      transcriptStatus: 'processing',
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(voiceStoryDrafts.id, draft.id))

  const readable = await getReadableUrl(env, draft.audioR2Key)
  const transcription = readable
    ? await transcribeAudioFromUrl(env.DEEPGRAM_API_KEY, readable.url, draft.languageHint)
    : await (async () => {
        const bytes = await downloadStorageBytes(env, draft.audioR2Key)
        if (!bytes) {
          throw new Error(
            'Audio is not readable. Configure GCS read access or R2_PUBLIC_BASE_URL before transcribing.'
          )
        }
        return transcribeAudioFromUrl(
          env.DEEPGRAM_API_KEY!,
          bytes,
          draft.languageHint,
          'application/octet-stream'
        )
      })()

  if (!transcription.transcript) {
    throw new Error('Deepgram returned an empty transcript')
  }

  await db
    .update(voiceStoryDrafts)
    .set({
      transcriptRaw: transcription.transcript,
      transcriptStatus: 'ready',
      status: 'review',
      updatedAt: new Date(),
    })
    .where(eq(voiceStoryDrafts.id, draft.id))

  const clarityJob = await enqueueJob(db, {
    type: 'clarity_edit',
    subjectType: 'voice_story_draft',
    subjectId: draft.id,
    provider: env.OPENROUTER_API_KEY ? 'openrouter' : env.OPENAI_API_KEY ? 'openai' : 'none',
    inngestEventKey: env.INNGEST_EVENT_KEY,
    env,
  })

  return {
    transcriptLength: transcription.transcript.length,
    detectedLanguage: transcription.detectedLanguage,
    clarityJobId: clarityJob.id,
  }
}

async function processClarityEdit(
  db: Database,
  env: ApiEnv,
  subjectId: string
): Promise<ProcessResult> {
  const draft = await db.query.voiceStoryDrafts.findFirst({
    where: eq(voiceStoryDrafts.id, subjectId),
  })
  if (!draft) throw new Error(`Voice story draft not found: ${subjectId}`)
  if (!draft.transcriptRaw) throw new Error('Voice story draft has no raw transcript')

  const result = await clarityEditTranscript(env, {
    transcript: draft.transcriptRaw,
    title: draft.title,
    year: draft.year,
    yearText: draft.yearText,
    location: draft.location,
    peopleNames: draft.peopleNames,
  })
  const edited = result?.edited ?? draft.transcriptRaw
  const titleSuggestion = !draft.title ? result?.titleSuggestion : undefined

  await db
    .update(voiceStoryDrafts)
    .set({
      transcriptEdited: edited,
      ...(titleSuggestion ? {title: titleSuggestion} : {}),
      status: 'review',
      updatedAt: new Date(),
    })
    .where(eq(voiceStoryDrafts.id, draft.id))

  return {
    provider: result ? (env.OPENROUTER_API_KEY ? 'openrouter' : 'openai') : 'fallback',
    editedLength: edited.length,
    titleSuggested: Boolean(titleSuggestion),
  }
}

async function processPublishStory(
  db: Database,
  env: ApiEnv,
  subjectId: string
): Promise<ProcessResult> {
  const draft = await db.query.voiceStoryDrafts.findFirst({
    where: eq(voiceStoryDrafts.id, subjectId),
  })
  if (!draft) throw new Error(`Voice story draft not found: ${subjectId}`)

  // Idempotent: never create a second Sanity doc for the same draft.
  if (draft.sanityStoryId) {
    return {sanityStoryId: draft.sanityStoryId, alreadyPublished: true}
  }

  const body = draft.transcriptEdited || draft.transcriptRaw
  if (!body) throw new Error('Voice story draft has no transcript to publish')

  const title = draft.title?.trim() || 'Community voice story'
  const slug = `${slugify(title) || 'voice-story'}-${Date.now().toString(36)}`
  const sanityPersonIds = draft.sanityPersonIds ?? []
  const people = sanityPersonIds.map((id) => ({
    _type: 'reference',
    _ref: id,
    _key: id.slice(0, 12),
  }))

  // Predetermine the document id so retries cannot spawn duplicates even if
  // the mutate response is lost.
  const predeterminedId = `community.${draft.id.replace(/-/g, '').slice(0, 22)}`
  const doc = {
    _id: predeterminedId,
    _type: 'story',
    title,
    slug: {_type: 'slug', current: slug},
    excerpt: body.slice(0, 240),
    year: draft.year,
    location: draft.location,
    people: people.length ? people : undefined,
    body: portableTextFromPlainText(body),
    publishedAt: new Date().toISOString(),
    era: 'community-submission',
    reviewStatus: 'pending',
  }

  const result = await sanityMutate(env, [{createOrReplace: doc}])
  if (!result.ok) {
    if (result.reason === 'unconfigured') {
      throw new Error('Sanity write API is not configured')
    }
    throw new Error(`Sanity story create failed (${result.status})`)
  }

  const sanityStoryId = result.data.results?.[0]?.id || predeterminedId

  await db
    .update(voiceStoryDrafts)
    .set({
      status: 'submitted',
      sanityStoryId,
      updatedAt: new Date(),
    })
    .where(eq(voiceStoryDrafts.id, draft.id))

  return {sanityStoryId, reviewStatus: 'pending'}
}

async function processUnsupported(type: string): Promise<ProcessResult> {
  return {
    skipped: true,
    reason: `No inline processor implemented for job type "${type}"`,
  }
}

export async function processJob(
  db: Database,
  env: ApiEnv,
  jobId: string
): Promise<ProcessResult> {
  const job = await db.query.processingJobs.findFirst({
    where: eq(processingJobs.id, jobId),
  })
  if (!job) throw new Error(`Processing job not found: ${jobId}`)

  await db
    .update(processingJobs)
    .set({
      status: 'running',
      attempts: sql`${processingJobs.attempts} + 1`,
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(processingJobs.id, job.id))

  try {
    const result =
      job.type === 'transcribe'
        ? await processTranscribe(db, env, job.subjectId)
        : job.type === 'clarity_edit'
          ? await processClarityEdit(db, env, job.subjectId)
          : job.type === 'publish_story'
            ? await processPublishStory(db, env, job.subjectId)
            : await processUnsupported(job.type)

    await db
      .update(processingJobs)
      .set({
        status: 'done',
        result,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, job.id))

    return result
  } catch (err) {
    const error = truncateError(err)
    await db
      .update(processingJobs)
      .set({
        status: 'failed',
        error,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, job.id))
    if (job.type === 'transcribe') {
      await markVoiceDraftTranscribeFailed(db, job.subjectType, job.subjectId, error)
    }
    throw err
  }
}
