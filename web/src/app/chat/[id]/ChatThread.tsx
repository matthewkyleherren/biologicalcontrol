'use client'

import {useAuth} from '@clerk/nextjs'
import Ably from 'ably'
import Link from 'next/link'
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {ChatConversation, ChatMessage, DirectoryEntry} from '@/components/chat/types'
import {useUnread} from '@/components/shell/UnreadProvider'
import {Alert, Avatar, Button, EmptyState, Icon, LoadingRegion, Skeleton} from '@/components/ui'
import {apiFetch} from '@/lib/api'
import {cn} from '@/lib/cn'
import {absoluteTime, clockTime, dayLabel, isNewDay, withinGroupWindow} from '@/lib/time'

function newClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `c-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** How close to the foot of the transcript still counts as "reading the end". */
const NEAR_BOTTOM_PX = 120

type MessageGroup = {
  key: string
  senderId: string
  senderName: string
  mine: boolean
  /** Set on the first group of a calendar day. */
  day: string | null
  messages: ChatMessage[]
}

function groupMessages(messages: ChatMessage[], meId: string | null): MessageGroup[] {
  const groups: MessageGroup[] = []
  let previous: ChatMessage | null = null

  for (const message of messages) {
    const startsDay = !previous || isNewDay(previous.createdAt, message.createdAt)
    const continues =
      previous !== null &&
      !startsDay &&
      previous.senderId === message.senderId &&
      withinGroupWindow(previous.createdAt, message.createdAt)

    if (continues && groups.length) {
      groups[groups.length - 1]!.messages.push(message)
    } else {
      groups.push({
        key: message.id,
        senderId: message.senderId,
        senderName: message.senderName ?? '',
        mine: Boolean(meId) && message.senderId === meId,
        day: startsDay ? dayLabel(message.createdAt) : null,
        messages: [message],
      })
    }
    previous = message
  }

  return groups
}

export function ChatThread({
  conversationId,
  directory = [],
}: {
  conversationId: string
  directory?: DirectoryEntry[]
}) {
  const {getToken, isLoaded} = useAuth()
  const tokenFn = useCallback(() => getToken(), [getToken])
  const {refresh: refreshUnread} = useUnread()

  const [meId, setMeId] = useState<string | null>(null)
  const [myName, setMyName] = useState<string>('')
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const ablyRef = useRef<Ably.Realtime | null>(null)
  const jumpedRef = useRef(false)
  const nearBottomRef = useRef(true)

  const load = useCallback(async () => {
    setError(null)
    setLoadFailed(false)
    try {
      const me = await apiFetch<{id: string; displayName: string}>('/me', {
        getAccessToken: tokenFn,
      })
      setMeId(me.id)
      setMyName(me.displayName)
      const convo = await apiFetch<{conversation: ChatConversation}>(
        `/conversations/${conversationId}`,
        {getAccessToken: tokenFn}
      )
      setConversation(convo.conversation)
      const msgs = await apiFetch<{messages: ChatMessage[]}>(
        `/conversations/${conversationId}/messages`,
        {getAccessToken: tokenFn}
      )
      setMessages(msgs.messages)
      setLoaded(true)
      // Fetching messages marks the thread read server-side; keep the badge honest.
      refreshUnread()
    } catch {
      setLoaded(true)
      setLoadFailed(true)
    }
  }, [conversationId, tokenFn, refreshUnread])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  // --- Scrolling ---------------------------------------------------------
  // First paint lands at the newest message with no animation, the way every
  // messaging app this audience uses behaves. After that, only follow the
  // conversation down if they are already reading the end — otherwise a new
  // message would yank them away from what they were re-reading.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !loaded) return

    if (!jumpedRef.current) {
      el.scrollTop = el.scrollHeight
      jumpedRef.current = true
      nearBottomRef.current = true
      return
    }
    if (!nearBottomRef.current) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'end'})
  }, [messages, loaded])

  // --- Realtime ----------------------------------------------------------
  useEffect(() => {
    if (!isLoaded || !meId) return
    let cancelled = false

    void (async () => {
      try {
        const data = await apiFetch<{
          tokenRequest?: Ably.TokenRequest
          mode?: string
          clientId?: string
        }>('/chat/token', {getAccessToken: tokenFn})

        if (cancelled || !data.tokenRequest) return

        const realtime = new Ably.Realtime({
          authCallback: (_tokenParams, callback) => {
            void apiFetch<{tokenRequest: Ably.TokenRequest}>('/chat/token', {
              getAccessToken: tokenFn,
            })
              .then((res) => callback(null, res.tokenRequest))
              .catch((err) => callback(String(err), null))
          },
          clientId: data.clientId || meId,
        })
        ablyRef.current = realtime

        const channel = realtime.channels.get(`conversation:${conversationId}`)
        channel.subscribe('message', (msg) => {
          const payload = msg.data as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id || m.clientId === payload.clientId)) {
              return prev
            }
            return [...prev, payload]
          })
        })
      } catch {
        // Polling fallback — silent
      }
    })()

    const poll = setInterval(() => {
      if (!ablyRef.current || ablyRef.current.connection.state !== 'connected') {
        void apiFetch<{messages: ChatMessage[]}>(`/conversations/${conversationId}/messages`, {
          getAccessToken: tokenFn,
        })
          .then((msgs) => setMessages(msgs.messages))
          .catch(() => {})
      }
    }, 12_000)

    return () => {
      cancelled = true
      clearInterval(poll)
      ablyRef.current?.close()
      ablyRef.current = null
    }
  }, [isLoaded, meId, conversationId, tokenFn])

  // --- Composer ----------------------------------------------------------
  // Grow with the text up to the max-height the composer CSS sets, then scroll.
  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    autoGrow()
  }, [draft, autoGrow])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSending(true)
    setError(null)
    nearBottomRef.current = true
    const clientId = newClientId()
    const optimistic: ChatMessage = {
      id: `temp-${clientId}`,
      body: text,
      senderId: meId || 'me',
      senderName: myName || 'You',
      clientId,
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    try {
      const data = await apiFetch<{message: ChatMessage}>(
        `/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          getAccessToken: tokenFn,
          body: {body: text, clientId},
        }
      )
      setMessages((prev) => prev.map((m) => (m.clientId === clientId ? data.message : m)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.clientId !== clientId))
      setDraft(text)
      setError('That message was not sent. It is back in the box below — try sending it again.')
    } finally {
      setSending(false)
    }
  }

  // --- Header identity ---------------------------------------------------
  const peers = useMemo(() => conversation?.peers ?? [], [conversation])
  const heading =
    conversation?.title || peers.map((p) => p.displayName).join(', ') || 'Conversation'
  const profileSlug = useMemo(() => {
    if (!conversation || conversation.type !== 'dm' || peers.length !== 1) return null
    const peerName = peers[0]!.displayName.trim().toLowerCase()
    if (!peerName) return null
    return directory.find((p) => p.name.trim().toLowerCase() === peerName)?.slug ?? null
  }, [conversation, peers, directory])

  const groups = useMemo(() => groupMessages(messages, meId), [messages, meId])

  const nameBlock = (
    <>
      <h1 className="truncate-1 text-[1.0625rem] font-semibold leading-tight text-ink">{heading}</h1>
      {profileSlug ? (
        <span className="meta-line truncate-1 block">View profile</span>
      ) : conversation && conversation.type === 'group' && conversation.memberCount ? (
        <span className="meta-line truncate-1 block">
          {conversation.memberCount} people in this conversation
        </span>
      ) : null}
    </>
  )

  return (
    // A thread is a whole screen: the site header, footer and tab bar all step
    // aside on this route, so the surface owns the viewport and supplies its
    // own way back.
    <div className="fixed inset-0 z-30 flex flex-col bg-paper">
      <header className="flex shrink-0 items-center gap-2 border-b border-rule bg-paper px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link href="/chat" className="btn btn--icon shrink-0" aria-label="Back to all messages">
          <Icon name="back" size={20} />
        </Link>
        <Avatar name={heading} size="sm" />
        {profileSlug ? (
          <Link
            href={`/people/${profileSlug}`}
            className="focus-ring -my-1 min-w-0 flex-1 rounded-[var(--radius-sm)] py-1"
          >
            {nameBlock}
          </Link>
        ) : (
          <div className="min-w-0 flex-1">{nameBlock}</div>
        )}
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scroll"
        aria-live="polite"
        aria-label="Conversation"
      >
        <div className="mx-auto w-full max-w-[48rem] px-4 pb-4">
          {!loaded ? (
            <LoadingRegion label="Loading this conversation">
              <div className="space-y-4 pt-6" aria-hidden>
                <Skeleton className="h-14 w-3/5 rounded-[var(--radius-lg)]" />
                <Skeleton className="ml-auto h-10 w-2/5 rounded-[var(--radius-lg)]" />
                <Skeleton className="h-20 w-4/5 rounded-[var(--radius-lg)]" />
                <Skeleton className="ml-auto h-14 w-1/2 rounded-[var(--radius-lg)]" />
              </div>
            </LoadingRegion>
          ) : loadFailed ? (
            <div className="pt-8">
              <EmptyState
                icon="alert"
                title="This conversation could not be opened"
                action={
                  <Button variant="secondary" onClick={() => void load()}>
                    Try again
                  </Button>
                }
              >
                The archive did not answer. Check your connection, then try again.
              </EmptyState>
            </div>
          ) : groups.length === 0 ? (
            <div className="pt-8">
              <EmptyState icon="messages" title="No messages yet">
                Nothing has been written here so far. Write the first message below — a greeting is
                enough to start.
              </EmptyState>
            </div>
          ) : (
            groups.map((group) => {
              const last = group.messages[group.messages.length - 1]!
              const pending = group.messages.some((m) => m.pending)
              return (
                <Fragment key={group.key}>
                  {group.day ? <p className="msg-day">{group.day}</p> : null}
                  <div className={cn('msg-group', group.mine && 'msg-group--mine')}>
                    <Avatar name={group.mine ? myName : group.senderName} size="sm" />
                    <div className="msg-stack">
                      {!group.mine ? (
                        <p className="msg-sender truncate-1">{group.senderName || 'Member'}</p>
                      ) : null}
                      {group.messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            'bubble',
                            group.mine ? 'bubble--mine' : 'bubble--theirs',
                            message.pending && 'bubble--pending'
                          )}
                        >
                          {message.body}
                        </div>
                      ))}
                      <p className="msg-time">
                        <time dateTime={last.createdAt} title={absoluteTime(last.createdAt)}>
                          {clockTime(last.createdAt)}
                        </time>
                        {pending ? ' · Sending' : null}
                      </p>
                    </div>
                  </div>
                </Fragment>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error ? (
        <div className="shrink-0 px-4 pb-2">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      {loadFailed ? null : (
        <form onSubmit={send} className="composer flex-wrap">
          <label className="sr-only" htmlFor="chat-draft">
            Write a message
          </label>
          <textarea
            id="chat-draft"
            ref={textareaRef}
            value={draft}
            rows={1}
            placeholder="Write a message"
            className="textarea min-w-0 flex-1"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(e as unknown as React.FormEvent)
              }
            }}
          />
          <Button type="submit" icon="send" loading={sending} disabled={!draft.trim()}>
            Send
          </Button>
          <p className="w-full text-[0.9375rem] leading-snug text-ink-faint">
            Press Enter to send. Hold Shift and press Enter to start a new line.
          </p>
        </form>
      )}
    </div>
  )
}
