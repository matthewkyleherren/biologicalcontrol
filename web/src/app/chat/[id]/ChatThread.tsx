'use client'

import {useAuth} from '@clerk/nextjs'
import Ably from 'ably'
import Link from 'next/link'
import {useCallback, useEffect, useRef, useState} from 'react'
import {apiFetch} from '@/lib/api'

type Message = {
  id: string
  body: string | null
  senderId: string
  senderName?: string
  clientId: string
  createdAt: string
}

type Conversation = {
  id: string
  title: string | null
  type: 'dm' | 'group'
  peers: Array<{id: string; displayName: string}>
}

function newClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `c-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ChatThread({conversationId}: {conversationId: string}) {
  const {getToken, isLoaded} = useAuth()
  const tokenFn = useCallback(() => getToken(), [getToken])
  const [meId, setMeId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const ablyRef = useRef<Ably.Realtime | null>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth'})
  }

  const load = useCallback(async () => {
    setError(null)
    try {
      const me = await apiFetch<{id: string}>('/me', {getAccessToken: tokenFn})
      setMeId(me.id)
      const convo = await apiFetch<{conversation: Conversation}>(
        `/conversations/${conversationId}`,
        {getAccessToken: tokenFn}
      )
      setConversation(convo.conversation)
      const msgs = await apiFetch<{messages: Message[]}>(
        `/conversations/${conversationId}/messages`,
        {getAccessToken: tokenFn}
      )
      setMessages(msgs.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load chat')
    }
  }, [conversationId, tokenFn])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

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
          const payload = msg.data as Message
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
        void apiFetch<{messages: Message[]}>(`/conversations/${conversationId}/messages`, {
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

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSending(true)
    setError(null)
    const clientId = newClientId()
    const optimistic: Message = {
      id: `temp-${clientId}`,
      body: text,
      senderId: meId || 'me',
      senderName: 'You',
      clientId,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setDraft('')
    try {
      const data = await apiFetch<{message: Message}>(
        `/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          getAccessToken: tokenFn,
          body: {body: text, clientId},
        }
      )
      setMessages((prev) =>
        prev.map((m) => (m.clientId === clientId ? data.message : m))
      )
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.clientId !== clientId))
      setDraft(text)
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[var(--measure-wide)] flex-col px-5 py-8 md:px-8 md:py-12">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <Link href="/chat" className="text-base text-ink-soft underline decoration-rule">
            ← All messages
          </Link>
          <h1 className="story-title mt-2 text-3xl md:text-4xl">
            {conversation?.title || 'Conversation'}
          </h1>
        </div>
      </div>

      {error ? <p className="mb-4 text-base text-red-800">{error}</p> : null}

      <div className="flex flex-1 flex-col border border-rule bg-paper-2">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
          {messages.map((m) => {
            const mine = meId && m.senderId === meId
            return (
              <div
                key={m.id}
                className={`max-w-[min(36rem,92%)] ${mine ? 'ml-auto text-right' : ''}`}
              >
                <p className="mb-1 text-sm text-ink-faint">{m.senderName || 'Friend'}</p>
                <div
                  className={`inline-block rounded-md px-4 py-3 text-left text-lg leading-relaxed ${
                    mine ? 'bg-ink text-paper' : 'border border-rule bg-paper text-ink'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={send}
          className="flex flex-col gap-3 border-t border-rule bg-paper p-4 sm:flex-row sm:items-end"
        >
          <label className="sr-only" htmlFor="chat-draft">
            Message
          </label>
          <textarea
            id="chat-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Write a message…"
            className="min-h-14 flex-1 rounded-md border border-rule bg-paper px-3 py-3 text-lg leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(e as unknown as React.FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="btn-primary min-h-14 shrink-0 disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </main>
  )
}
