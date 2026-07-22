'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {Alert, Avatar, Icon, IconButton, SearchInput, Skeleton} from '@/components/ui'
import {apiFetch} from '@/lib/api'
import {cn} from '@/lib/cn'
import type {ChatSearchUser} from './types'

const SEARCH_ID = 'new-message-search'

/**
 * Choosing who to write to is an occasional act, so it gets a dialog rather
 * than a search box parked permanently above the conversation list — the old
 * layout put "find a stranger" above "the people you actually talk to".
 *
 * Native `<dialog showModal()>` is used on purpose: it gives the focus trap,
 * the Escape key, and the inert background for free, which a hand-rolled
 * overlay would have to reimplement and usually gets wrong.
 */
export function NewMessageDialog({
  open,
  onClose,
  getAccessToken,
  onPick,
}: {
  open: boolean
  onClose: () => void
  getAccessToken: () => Promise<string | null>
  /** Resolve once the conversation is created; the caller navigates. */
  onPick: (user: ChatSearchUser) => Promise<void>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<ChatSearchUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)

  // Open and close the real dialog element in step with the `open` prop.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      // showModal() focuses the first tabbable child, which is the close
      // button. The search field is what someone came here to use.
      window.requestAnimationFrame(() => {
        document.getElementById(SEARCH_ID)?.focus()
      })
    }
    if (!open && el.open) el.close()
  }, [open])

  // Reset between openings so the previous search does not linger.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setUsers(null)
      setError(null)
      setStartingId(null)
    }
  }, [open])

  const runSearch = useCallback(
    async (q: string) => {
      setError(null)
      try {
        const data = await apiFetch<{users: ChatSearchUser[]}>(
          `/users/search?q=${encodeURIComponent(q)}`,
          {getAccessToken}
        )
        setUsers(data.users)
      } catch {
        setUsers([])
        setError('The member list could not be loaded. Check your connection and search again.')
      }
    },
    [getAccessToken]
  )

  useEffect(() => {
    if (!open) return
    // The previous result set stays on screen while the new one is fetched —
    // blanking it on every keystroke made the list flicker.
    const timer = setTimeout(() => void runSearch(query), 250)
    return () => clearTimeout(timer)
  }, [open, query, runSearch])

  async function pick(user: ChatSearchUser) {
    setStartingId(user.id)
    setError(null)
    try {
      await onPick(user)
    } catch {
      setError(`The conversation with ${user.displayName} could not be started. Try again.`)
      setStartingId(null)
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="new-message-title"
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-[min(32rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-md)]',
        'border border-rule bg-paper p-0 text-ink',
        'max-h-[min(34rem,calc(100dvh-3rem))]',
        'backdrop:bg-ink/45'
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rule px-3 py-2">
          <h2 id="new-message-title" className="px-1 text-[1.125rem] font-bold tracking-tight">
            New message
          </h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>

        <div className="shrink-0 px-4 pt-3">
          <SearchInput
            id={SEARCH_ID}
            value={query}
            onValueChange={setQuery}
            label="Search members by name"
            placeholder="Search by name"
          />
          <p className="mt-2 text-[0.9375rem] leading-snug text-ink-faint">
            Everyone here has an account on the archive. Pick a name to open a private
            conversation.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
          {error ? (
            <Alert tone="error" className="mt-3">
              {error}
            </Alert>
          ) : null}

          {users === null ? (
            <div className="mt-2 space-y-4 py-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="py-6 text-center text-[1.0625rem] leading-relaxed text-ink-soft">
              {query.trim()
                ? `No member is listed under “${query.trim()}”. They need to join the archive before you can write to them.`
                : 'No other members have joined yet. Once someone does, their name appears here.'}
            </p>
          ) : (
            <ul className="list mt-1">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="list-row focus-ring disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={startingId !== null}
                    aria-busy={startingId === u.id || undefined}
                    onClick={() => void pick(u)}
                  >
                    <Avatar name={u.displayName} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="truncate-1 block text-[1.0625rem] font-medium text-ink">
                        {u.displayName}
                      </span>
                      {u.howConnected ? (
                        <span className="meta-line truncate-1 block">{u.howConnected}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-ink-faint">
                      <Icon name="forward" size={18} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
