'use client'

import {useAuth} from '@clerk/nextjs'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {NewMessageDialog} from '@/components/chat/NewMessageDialog'
import type {ChatConversation, ChatSearchUser} from '@/components/chat/types'
import {
  Alert,
  Avatar,
  Button,
  EmptyState,
  LoadingRegion,
  SearchInput,
  SkeletonRows,
} from '@/components/ui'
import {apiFetch} from '@/lib/api'
import {cn} from '@/lib/cn'
import {listTime} from '@/lib/time'

/** One line, no newlines, for the row preview. */
function previewOf(convo: ChatConversation, meId: string | null): string {
  const last = convo.lastMessage
  if (!last) return 'No messages yet'
  const body = (last.body ?? '').replace(/\s+/g, ' ').trim()
  const text = body || '—'
  return meId && last.senderId === meId ? `You: ${text}` : text
}

function matches(convo: ChatConversation, needle: string): boolean {
  if (!needle) return true
  const haystack = [
    convo.title ?? '',
    convo.compoundLabel ?? '',
    ...convo.peers.map((p) => p.displayName),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

/**
 * The inbox: a conversation rail, and on a wide screen a panel that says what
 * the rail is for.
 *
 * What changed from the page this replaces: the people-search box that used to
 * sit permanently above the thread list has moved into a "New message" dialog,
 * the list itself now carries avatars, timestamps, previews and unread counts,
 * and the search field above the list searches the conversations someone
 * already has rather than the whole membership.
 */
export function ChatInbox() {
  const {getToken, isLoaded} = useAuth()
  const router = useRouter()
  const tokenFn = useCallback(() => getToken(), [getToken])

  const [meId, setMeId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [composing, setComposing] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [me, data] = await Promise.all([
        apiFetch<{id: string}>('/me', {getAccessToken: tokenFn}),
        apiFetch<{conversations: ChatConversation[]}>('/conversations', {getAccessToken: tokenFn}),
      ])
      setMeId(me.id)
      setConversations(data.conversations)
    } catch {
      setConversations([])
      setError('Your conversations could not be loaded. Check your connection and try again.')
    }
  }, [tokenFn])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  const needle = filter.trim().toLowerCase()
  const visible = useMemo(
    () => (conversations ?? []).filter((c) => matches(c, needle)),
    [conversations, needle]
  )

  const startDm = useCallback(
    async (user: ChatSearchUser) => {
      const data = await apiFetch<{conversation: ChatConversation}>('/conversations/dm', {
        method: 'POST',
        getAccessToken: tokenFn,
        body: {peerUserId: user.id},
      })
      setComposing(false)
      router.push(`/chat/${data.conversation.id}`)
    },
    [router, tokenFn]
  )

  const newMessageButton = (
    <Button icon="compose" size="sm" onClick={() => setComposing(true)}>
      New message
    </Button>
  )

  return (
    <div className="chat-shell">
      <section className="chat-rail" aria-label="Your conversations">
        <div className="sticky top-[var(--header-h)] z-10 border-b border-rule bg-paper px-4 pb-3 pt-4 lg:static lg:px-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 text-[1.5rem] font-bold leading-tight tracking-tight text-ink">
              Messages
            </h1>
            {newMessageButton}
          </div>
          <SearchInput
            className="mt-3"
            value={filter}
            onValueChange={setFilter}
            label="Search your conversations"
            placeholder="Search your conversations"
          />
        </div>

        <div className="chat-scroll">
          {error ? (
            <div className="p-4">
              <Alert tone="error">{error}</Alert>
              <Button variant="secondary" className="mt-3" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : null}

          {conversations === null ? (
            <LoadingRegion label="Loading your conversations">
              <SkeletonRows rows={6} className="px-4" />
            </LoadingRegion>
          ) : error ? null : conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState icon="messages" title="No conversations yet" action={newMessageButton}>
                Messages here are private, between you and one other member. Use them to ask about
                a photograph, fill in a name nobody can remember, or say hello after thirty years.
              </EmptyState>
            </div>
          ) : visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-[1.0625rem] leading-relaxed text-ink-soft">
              No conversation matches “{filter.trim()}”. Clear the search to see them all.
            </p>
          ) : (
            <ul>
              {visible.map((convo) => {
                const unread = convo.unreadCount ?? 0
                const name =
                  convo.title || convo.peers.map((p) => p.displayName).join(', ') || 'Conversation'
                return (
                  <li key={convo.id}>
                    <Link
                      href={`/chat/${convo.id}`}
                      className={cn('convo-row focus-ring', unread > 0 && 'is-unread')}
                    >
                      <Avatar name={name} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="convo-name truncate-1 flex-1">{name}</span>
                          {convo.lastMessage ? (
                            <span className="convo-time">
                              {listTime(convo.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="convo-preview truncate-1 flex-1">
                            {previewOf(convo, meId)}
                          </span>
                          {unread > 0 ? (
                            <>
                              <span className="badge" aria-hidden>
                                {unread > 99 ? '99+' : unread}
                              </span>
                              <span className="sr-only">
                                {unread} unread {unread === 1 ? 'message' : 'messages'}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Wide screens keep the rail beside a panel that names what it is for. */}
      <div className="hidden min-h-0 items-center justify-center p-8 lg:flex">
        <EmptyState icon="messages" title="Choose a conversation" action={newMessageButton}>
          Open a conversation on the left to read it, or start a new one with anybody who has
          joined the archive.
        </EmptyState>
      </div>

      <NewMessageDialog
        open={composing}
        onClose={() => setComposing(false)}
        getAccessToken={tokenFn}
        onPick={startDm}
      />
    </div>
  )
}
