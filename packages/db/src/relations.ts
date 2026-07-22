import {relations} from 'drizzle-orm'
import {
  conversationMembers,
  conversations,
  messageAttachments,
  messages,
  personClaims,
  photoAttributions,
  photoPersonTags,
  photos,
  processingJobs,
  profiles,
  users,
  voiceStoryDrafts,
} from './schema'

export const usersRelations = relations(users, ({one, many}) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  claims: many(personClaims),
  photos: many(photos),
  voiceDrafts: many(voiceStoryDrafts),
}))

export const profilesRelations = relations(profiles, ({one}) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}))

export const personClaimsRelations = relations(personClaims, ({one}) => ({
  user: one(users, {
    fields: [personClaims.userId],
    references: [users.id],
  }),
}))

export const conversationsRelations = relations(conversations, ({many}) => ({
  members: many(conversationMembers),
  messages: many(messages),
}))

export const conversationMembersRelations = relations(conversationMembers, ({one}) => ({
  conversation: one(conversations, {
    fields: [conversationMembers.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationMembers.userId],
    references: [users.id],
  }),
}))

export const messagesRelations = relations(messages, ({one, many}) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  attachments: many(messageAttachments),
}))

export const messageAttachmentsRelations = relations(messageAttachments, ({one}) => ({
  message: one(messages, {
    fields: [messageAttachments.messageId],
    references: [messages.id],
  }),
}))

export const photosRelations = relations(photos, ({one, many}) => ({
  uploader: one(users, {
    fields: [photos.uploaderId],
    references: [users.id],
  }),
  attributions: many(photoAttributions),
  personTags: many(photoPersonTags),
}))

export const photoPersonTagsRelations = relations(photoPersonTags, ({one}) => ({
  photo: one(photos, {
    fields: [photoPersonTags.photoId],
    references: [photos.id],
  }),
}))

export const photoAttributionsRelations = relations(photoAttributions, ({one}) => ({
  photo: one(photos, {
    fields: [photoAttributions.photoId],
    references: [photos.id],
  }),
}))

export const voiceStoryDraftsRelations = relations(voiceStoryDrafts, ({one}) => ({
  user: one(users, {
    fields: [voiceStoryDrafts.userId],
    references: [users.id],
  }),
}))

export const processingJobsRelations = relations(processingJobs, ({}) => ({}))
