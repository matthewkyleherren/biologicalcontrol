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
})
export type SubmitVoiceDraftBody = z.infer<typeof submitVoiceDraftBodySchema>

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
