import {z} from 'zod'

export const UserRole = z.enum(['community', 'editor', 'admin'])
export type UserRole = z.infer<typeof UserRole>

export const ClaimStatus = z.enum(['pending', 'approved', 'rejected', 'revoked'])
export type ClaimStatus = z.infer<typeof ClaimStatus>

export const Locale = z.enum(['en', 'fr'])
export type Locale = z.infer<typeof Locale>

export const ConversationType = z.enum(['dm', 'group'])
export type ConversationType = z.infer<typeof ConversationType>

export const PhotoVisibility = z.enum(['private', 'community', 'public'])
export type PhotoVisibility = z.infer<typeof PhotoVisibility>

export const JobType = z.enum([
  'enhance',
  'face_detect',
  'face_match',
  'date_infer',
  'transcribe',
  'clarity_edit',
  'publish_story',
])
export type JobType = z.infer<typeof JobType>

export const JobStatus = z.enum(['queued', 'running', 'done', 'failed'])
export type JobStatus = z.infer<typeof JobStatus>

export const VoiceDraftStatus = z.enum([
  'recording',
  'processing',
  'review',
  'submitted',
  'published',
  'rejected',
])
export type VoiceDraftStatus = z.infer<typeof VoiceDraftStatus>

export const meResponseSchema = z.object({
  id: z.string().uuid(),
  clerkUserId: z.string().nullable(),
  displayName: z.string(),
  email: z.string().nullable(),
  phoneE164: z.string().nullable(),
  role: UserRole,
  locale: Locale,
  howConnected: z.string().nullable(),
  faceConsentAt: z.string().datetime().nullable(),
  voiceConsentAt: z.string().datetime().nullable(),
  approvedClaimPersonId: z.string().nullable(),
})
export type MeResponse = z.infer<typeof meResponseSchema>

export const createClaimBodySchema = z.object({
  sanityPersonId: z.string().min(1),
  note: z.string().max(2000).optional(),
})
export type CreateClaimBody = z.infer<typeof createClaimBodySchema>

export const updateProfileBodySchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  bioShort: z.string().max(2000).optional(),
  howConnected: z.string().max(500).optional(),
  locale: Locale.optional(),
})
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>

export const createVoiceDraftBodySchema = z.object({
  audioR2Key: z.string().min(1),
  audioDurationMs: z.number().int().positive().max(20 * 60 * 1000),
  languageHint: z.enum(['en', 'fr', 'auto']).default('auto'),
  voiceConsent: z.literal(true),
})
export type CreateVoiceDraftBody = z.infer<typeof createVoiceDraftBodySchema>

export const submitVoiceDraftBodySchema = z.object({
  title: z.string().min(1).max(200),
  transcriptEdited: z.string().min(1).max(100_000),
  sanityPersonIds: z.array(z.string()).default([]),
  publishAudio: z.boolean().default(false),
  year: z.number().int().min(1975).max(2030).optional(),
  location: z.string().max(200).optional(),
  yearText: z.string().max(120).optional(),
})
export type SubmitVoiceDraftBody = z.infer<typeof submitVoiceDraftBodySchema>

export const VoiceAgentSessionStatus = z.enum([
  'idle',
  'active',
  'processing',
  'review',
  'abandoned',
  'completed',
])
export type VoiceAgentSessionStatus = z.infer<typeof VoiceAgentSessionStatus>

export const VoiceAgentStage = z.enum([
  'greeting',
  'consent',
  'who',
  'when',
  'where',
  'title',
  'story',
  'confirm',
  'done',
])
export type VoiceAgentStage = z.infer<typeof VoiceAgentStage>

export const voiceAgentMetaSchema = z.object({
  peopleNames: z.array(z.string()).optional(),
  peopleSanityIds: z.array(z.string()).optional(),
  year: z.number().int().optional(),
  yearText: z.string().max(120).optional(),
  location: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
})
export type VoiceAgentMeta = z.infer<typeof voiceAgentMetaSchema>

export const voiceAgentSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  draftId: z.string().uuid().nullable(),
  status: VoiceAgentSessionStatus,
  stage: VoiceAgentStage,
  languageHint: z.enum(['en', 'fr', 'auto']),
  provider: z.literal('deepgram_agent').or(z.string()),
  providerSessionRef: z.string().nullable(),
  metaJson: voiceAgentMetaSchema.default({}),
  interviewAudioR2Key: z.string().nullable(),
  storyAudioR2Key: z.string().nullable(),
  transcriptInterview: z.string().nullable(),
  agentSummary: z.string().nullable(),
  consentRecordedAt: z.string().datetime().nullable(),
  error: z.string().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type VoiceAgentSession = z.infer<typeof voiceAgentSessionSchema>

export const createVoiceAgentSessionBodySchema = z.object({
  languageHint: z.enum(['en', 'fr', 'auto']).optional(),
  resumeSessionId: z.string().uuid().optional(),
})
export type CreateVoiceAgentSessionBody = z.infer<typeof createVoiceAgentSessionBodySchema>

export const voiceAgentEventBodySchema = z.object({
  type: z.enum(['stage', 'meta', 'user_text', 'error', 'heartbeat']),
  payload: z
    .object({
      stage: VoiceAgentStage.optional(),
      meta: voiceAgentMetaSchema.optional(),
      text: z.string().max(20_000).optional(),
      error: z.string().max(2000).optional(),
      consent: z.boolean().optional(),
      agentSummary: z.string().max(4000).optional(),
    })
    .default({}),
})
export type VoiceAgentEventBody = z.infer<typeof voiceAgentEventBodySchema>

export const completeVoiceAgentStoryBodySchema = z.object({
  audioR2Key: z.string().min(1).optional(),
  audioDurationMs: z.number().int().positive().max(20 * 60 * 1000).optional(),
  providerRecordingId: z.string().max(200).optional(),
  interviewAudioR2Key: z.string().min(1).optional(),
})
export type CompleteVoiceAgentStoryBody = z.infer<typeof completeVoiceAgentStoryBodySchema>

export const deepgramVoiceAgentConnectionSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('direct_websocket'),
    url: z.literal('wss://agent.deepgram.com/v1/agent/converse').or(z.string().url()),
    temporaryKey: z.string(),
    expiresIn: z.number().positive(),
    expiresAt: z.string().datetime(),
    authorizationScheme: z.literal('Bearer'),
    settings: z.record(z.unknown()),
  }),
  z.object({
    mode: z.literal('server_proxy_required'),
    url: z.literal('wss://agent.deepgram.com/v1/agent/converse').or(z.string().url()),
    reason: z.string(),
    settings: z.record(z.unknown()),
  }),
])
export type DeepgramVoiceAgentConnection = z.infer<typeof deepgramVoiceAgentConnectionSchema>

export const createVoiceAgentSessionResponseSchema = z.object({
  session: voiceAgentSessionSchema,
  consentRequired: z.boolean(),
  stageHints: z.record(z.string()),
  deepgram: deepgramVoiceAgentConnectionSchema,
})
export type CreateVoiceAgentSessionResponse = z.infer<
  typeof createVoiceAgentSessionResponseSchema
>

export const voiceAgentSessionResponseSchema = z.object({
  session: voiceAgentSessionSchema,
})
export type VoiceAgentSessionResponse = z.infer<typeof voiceAgentSessionResponseSchema>

export const completeVoiceAgentStoryResponseSchema = z.object({
  session: voiceAgentSessionSchema,
  draftId: z.string().uuid(),
})
export type CompleteVoiceAgentStoryResponse = z.infer<
  typeof completeVoiceAgentStoryResponseSchema
>

/**
 * Phase B MVP: staged MediaRecorder utterances (no browser Deepgram key).
 * Client records per stage → upload → this endpoint → ASR + LLM stage advance.
 */
export const voiceAgentUtteranceBodySchema = z.object({
  audioR2Key: z.string().min(1).optional(),
  text: z.string().min(1).max(20_000).optional(),
  languageHint: z.enum(['en', 'fr', 'auto']).optional(),
}).refine((v) => Boolean(v.audioR2Key || v.text), {
  message: 'Provide audioR2Key or text',
})
export type VoiceAgentUtteranceBody = z.infer<typeof voiceAgentUtteranceBodySchema>

export const createMessageBodySchema = z.object({
  body: z.string().max(10_000).optional(),
  clientId: z.string().uuid(),
  attachmentR2Key: z.string().optional(),
  attachmentMime: z.string().optional(),
})
export type CreateMessageBody = z.infer<typeof createMessageBodySchema>

export const createStoryDraftBodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(100_000),
  year: z.number().int().min(1975).max(2030).optional(),
  location: z.string().max(200).optional(),
  sanityPersonIds: z.array(z.string()).max(40).default([]),
})
export type CreateStoryDraftBody = z.infer<typeof createStoryDraftBodySchema>

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.literal('biologicalcontrol-api'),
  authMode: z.enum(['clerk', 'dev-bypass', 'unconfigured']),
  database: z.enum(['connected', 'unconfigured', 'error']),
  storage: z.enum(['gcs', 'r2', 'unconfigured']).optional(),
})
export type HealthResponse = z.infer<typeof healthResponseSchema>
