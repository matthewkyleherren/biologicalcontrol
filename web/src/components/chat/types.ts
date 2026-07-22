/**
 * The messaging shapes the API actually returns.
 *
 * Deliberately narrow: everything here maps to a field in
 * `docs/frontend-contract.md`. There is no `readAt`, no `reactions`, no
 * `typing` — those do not exist server-side and must not be invented in the UI.
 */

export type ChatPeer = {
  id: string
  displayName: string
}

export type ChatLastMessage = {
  id: string
  body: string | null
  senderId: string
  senderName: string | null
  createdAt: string
}

export type ChatConversation = {
  id: string
  type: 'dm' | 'group'
  title: string | null
  compoundLabel?: string | null
  peers: ChatPeer[]
  memberCount?: number
  /** Added by the redesign — messages from others since this member last opened it. */
  unreadCount?: number
  lastMessage: ChatLastMessage | null
  createdAt?: string
  updatedAt: string
}

export type ChatMessage = {
  id: string
  conversationId?: string
  senderId: string
  senderName?: string | null
  body: string | null
  clientId: string
  createdAt: string
  /** Client-only: set on an optimistic message that has not been acknowledged. */
  pending?: boolean
}

export type ChatSearchUser = {
  id: string
  displayName: string
  howConnected?: string | null
}

/** A Sanity person the thread header can link to, matched by display name. */
export type DirectoryEntry = {
  name: string
  slug: string
}
