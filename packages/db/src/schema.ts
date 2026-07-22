import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['community', 'editor', 'admin'])
export const claimStatusEnum = pgEnum('claim_status', [
  'pending',
  'approved',
  'rejected',
  'revoked',
])
export const localeEnum = pgEnum('locale', ['en', 'fr'])
export const conversationTypeEnum = pgEnum('conversation_type', ['dm', 'group'])
export const memberRoleEnum = pgEnum('member_role', ['member', 'admin'])
export const photoVisibilityEnum = pgEnum('photo_visibility', [
  'private',
  'community',
  'public',
])
export const enhanceStatusEnum = pgEnum('enhance_status', [
  'none',
  'queued',
  'done',
  'failed',
])
export const jobTypeEnum = pgEnum('job_type', [
  'enhance',
  'face_detect',
  'face_match',
  'date_infer',
  'transcribe',
  'publish_story',
])
export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'running',
  'done',
  'failed',
])
export const tagSourceEnum = pgEnum('tag_source', [
  'studio',
  'app',
  'ai_suggested',
  'human',
  'ai',
  'uploader',
])
export const voiceDraftStatusEnum = pgEnum('voice_draft_status', [
  'recording',
  'processing',
  'review',
  'submitted',
  'published',
  'rejected',
])
export const transcriptStatusEnum = pgEnum('transcript_status', [
  'pending',
  'processing',
  'ready',
  'failed',
])
export const languageHintEnum = pgEnum('language_hint', ['en', 'fr', 'auto'])
export const platformEnum = pgEnum('platform', ['ios', 'android', 'web'])
export const attachmentKindEnum = pgEnum('attachment_kind', [
  'image',
  'audio',
  'file',
])
export const faceClusterStatusEnum = pgEnum('face_cluster_status', [
  'unknown',
  'linked',
  'rejected',
])

const timestamps = {
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: varchar('clerk_user_id', {length: 128}).unique(),
    phoneE164: varchar('phone_e164', {length: 32}).unique(),
    email: varchar('email', {length: 320}),
    displayName: varchar('display_name', {length: 160}).notNull().default('Friend'),
    role: userRoleEnum('role').notNull().default('community'),
    locale: localeEnum('locale').notNull().default('en'),
    faceConsentAt: timestamp('face_consent_at', {withTimezone: true}),
    voiceConsentAt: timestamp('voice_consent_at', {withTimezone: true}),
    ...timestamps,
  }
)

export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, {onDelete: 'cascade'}),
  bioShort: text('bio_short'),
  avatarR2Key: text('avatar_r2_key'),
  howConnected: varchar('how_connected', {length: 500}),
  ...timestamps,
})

export const personClaims = pgTable(
  'person_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    sanityPersonId: varchar('sanity_person_id', {length: 128}).notNull(),
    status: claimStatusEnum('status').notNull().default('pending'),
    note: text('note'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', {withTimezone: true}),
    ...timestamps,
  },
  (t) => [uniqueIndex('person_claims_user_person_uidx').on(t.userId, t.sanityPersonId)]
)

export const storyPersonTags = pgTable(
  'story_person_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sanityStoryId: varchar('sanity_story_id', {length: 128}).notNull(),
    sanityPersonId: varchar('sanity_person_id', {length: 128}).notNull(),
    source: tagSourceEnum('source').notNull().default('app'),
    createdBy: uuid('created_by').references(() => users.id),
    confidence: real('confidence'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('story_person_tags_uidx').on(t.sanityStoryId, t.sanityPersonId, t.source),
  ]
)

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: conversationTypeEnum('type').notNull(),
  title: varchar('title', {length: 200}),
  compoundLabel: varchar('compound_label', {length: 120}),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  ...timestamps,
})

export const conversationMembers = pgTable(
  'conversation_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, {onDelete: 'cascade'}),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    role: memberRoleEnum('role').notNull().default('member'),
    muted: boolean('muted').notNull().default(false),
    lastReadAt: timestamp('last_read_at', {withTimezone: true}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('conversation_members_uidx').on(t.conversationId, t.userId),
  ]
)

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, {onDelete: 'cascade'}),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  body: text('body'),
  clientId: uuid('client_id').notNull(),
  editedAt: timestamp('edited_at', {withTimezone: true}),
  deletedAt: timestamp('deleted_at', {withTimezone: true}),
  ...timestamps,
})

export const messageAttachments = pgTable('message_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => messages.id, {onDelete: 'cascade'}),
  r2Key: text('r2_key').notNull(),
  mime: varchar('mime', {length: 120}).notNull(),
  width: integer('width'),
  height: integer('height'),
  kind: attachmentKindEnum('kind').notNull().default('image'),
  ...timestamps,
})

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploaderId: uuid('uploader_id')
    .notNull()
    .references(() => users.id),
  originalR2Key: text('original_r2_key').notNull(),
  sha256: varchar('sha256', {length: 64}),
  byteSize: integer('byte_size'),
  mime: varchar('mime', {length: 120}),
  width: integer('width'),
  height: integer('height'),
  exifTakenAt: timestamp('exif_taken_at', {withTimezone: true}),
  inferredTakenAt: timestamp('inferred_taken_at', {withTimezone: true}),
  inferredTakenAtConfidence: real('inferred_taken_at_confidence'),
  inferredTakenAtBasis: jsonb('inferred_taken_at_basis'),
  sanityGalleryId: varchar('sanity_gallery_id', {length: 128}),
  visibility: photoVisibilityEnum('visibility').notNull().default('community'),
  enhanceStatus: enhanceStatusEnum('enhance_status').notNull().default('none'),
  enhancedR2Key: text('enhanced_r2_key'),
  caption: text('caption'),
  ...timestamps,
})

export const photoAttributions = pgTable('photo_attributions', {
  id: uuid('id').defaultRandom().primaryKey(),
  photoId: uuid('photo_id')
    .notNull()
    .references(() => photos.id, {onDelete: 'cascade'}),
  photographerName: varchar('photographer_name', {length: 200}),
  creditLine: text('credit_line'),
  ...timestamps,
})

export const faceClusters = pgTable('face_clusters', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalRef: text('external_ref'),
  suggestedPersonId: varchar('suggested_person_id', {length: 128}),
  status: faceClusterStatusEnum('status').notNull().default('unknown'),
  ...timestamps,
})

export const photoPersonTags = pgTable('photo_person_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  photoId: uuid('photo_id')
    .notNull()
    .references(() => photos.id, {onDelete: 'cascade'}),
  sanityPersonId: varchar('sanity_person_id', {length: 128}),
  faceClusterId: uuid('face_cluster_id').references(() => faceClusters.id),
  bbox: jsonb('bbox'),
  source: tagSourceEnum('source').notNull().default('human'),
  confidence: real('confidence'),
  confirmedBy: uuid('confirmed_by').references(() => users.id),
  confirmedAt: timestamp('confirmed_at', {withTimezone: true}),
  ...timestamps,
})

export const processingJobs = pgTable('processing_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: jobTypeEnum('type').notNull(),
  subjectType: varchar('subject_type', {length: 64}).notNull(),
  subjectId: uuid('subject_id').notNull(),
  status: jobStatusEnum('status').notNull().default('queued'),
  provider: varchar('provider', {length: 64}),
  providerRef: text('provider_ref'),
  attempts: integer('attempts').notNull().default(0),
  error: text('error'),
  result: jsonb('result'),
  ...timestamps,
})

export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    platform: platformEnum('platform').notNull(),
    token: text('token').notNull(),
    lastSeenAt: timestamp('last_seen_at', {withTimezone: true}).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('device_tokens_token_uidx').on(t.token)]
)

export const voiceStoryDrafts = pgTable('voice_story_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {onDelete: 'cascade'}),
  audioR2Key: text('audio_r2_key').notNull(),
  audioDurationMs: integer('audio_duration_ms').notNull(),
  languageHint: languageHintEnum('language_hint').notNull().default('auto'),
  transcriptStatus: transcriptStatusEnum('transcript_status').notNull().default('pending'),
  transcriptRaw: text('transcript_raw'),
  transcriptEdited: text('transcript_edited'),
  title: varchar('title', {length: 200}),
  sanityPersonIds: jsonb('sanity_person_ids').$type<string[]>().default([]),
  publishAudio: boolean('publish_audio').notNull().default(false),
  status: voiceDraftStatusEnum('status').notNull().default('recording'),
  sanityStoryId: varchar('sanity_story_id', {length: 128}),
  consentRecordedAt: timestamp('consent_recorded_at', {withTimezone: true}),
  year: integer('year'),
  ...timestamps,
})

export const moderationFlags = pgTable('moderation_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  targetType: varchar('target_type', {length: 64}).notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  reporterId: uuid('reporter_id').references(() => users.id),
  status: varchar('status', {length: 32}).notNull().default('open'),
  ...timestamps,
})
