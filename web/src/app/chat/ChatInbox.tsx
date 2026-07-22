'use client'

import {useAuth} from '@clerk/nextjs'
import Link from 'next/link'
import {useCallback, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {apiFetch} from '@/lib/api'

type Conversation = {
  id: string
  type: 'dm' | 'group'
  title: string | null
  compoundLabel?: string | null
  peers: Array<{id: string; displayName: string}>
  lastMessage: {body: string | null; createdAt: string} | null
  updatedAt: string
}

type SearchUser = {id: string; displayName: string}

export function ChatInbox() {
  const {getToken, isLoaded} = useAuth()
  const router = useRouter()
  const tokenFn = useCallback(() => getToken(), [getToken])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiFetch<{conversations: Conversation[]}>('/conversations', {
        getAccessToken: tokenFn,
      })
      setConversations(data.conversations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load conversations')
    }
  }, [tokenFn])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  useEffect(() => {
    if (!isLoaded) return
    const t = setTimeout(() => {
      void (async () => {
        try {
          const data = await apiFetch<{users: SearchUser[]}>(
            `/users/search?q=${encodeURIComponent(query)}`,
            {getAccessToken: tokenFn}
          )
          setResults(data.users)
        } catch {
          setResults([])
        }
      })()
    }, 250)
    return () => clearTimeout(t)
  }, [query, isLoaded, tokenFn])

  async function startDm(peerUserId: string) {
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<{conversation: Conversation}>('/conversations/dm', {
        method: 'POST',
        getAccessToken: tokenFn,
        body: {peerUserId},
      })
      router.push(`/chat/${data.conversation.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start conversation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <p className="rail-title">Stay in touch</p>
      <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Messages</h1>
      <p className="mt-5 text-xl leading-relaxed text-ink-soft">
        Direct messages and compound threads. Large type, plain words — someone can help on the
        same phone.
      </p>

      {error ? <p className="mt-6 text-base text-red-800">{error}</p> : null}

      <section className="mt-10 border-t border-rule pt-10">
        <h2 className="story-title text-2xl">Start a conversation</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name…"
          className="mt-4 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
        />
        {results.length ? (
          <ul className="mt-4 divide-y divide-rule border border-rule">
            {results.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-lg">{u.displayName}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startDm(u.id)}
                  className="btn-primary disabled:opacity-60"
                >
                  Message
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-base text-ink-faint">
            {query
              ? 'No matches yet — they need an account first.'
              : 'Recent community members appear here once people sign up.'}
          </p>
        )}
      </section>

      <section className="mt-14 border-t border-rule pt-10">
        <h2 className="story-title text-2xl">Your threads</h2>
        {!conversations.length ? (
          <p className="mt-4 text-lg text-ink-soft">No conversations yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-rule border border-rule">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="block px-4 py-4 transition-colors hover:bg-paper-2"
                >
                  <p className="text-xl font-medium text-ink">{c.title || 'Conversation'}</p>
                  {c.compoundLabel ? (
                    <p className="text-sm text-ink-faint">{c.compoundLabel}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-base text-ink-soft">
                    {c.lastMessage?.body || 'No messages yet'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
