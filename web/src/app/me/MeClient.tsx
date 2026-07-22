'use client'

import {useAuth} from '@clerk/nextjs'
import {useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {apiFetch} from '@/lib/api'
import type {MeResponse} from '@biologicalcontrol/shared'

type PersonOption = {
  _id: string
  name: string
  slug: string
  role?: string | null
  yearsActive?: string | null
}

type ClaimRow = {
  id: string
  sanityPersonId: string
  status: string
  note?: string | null
}

export function MeClient({people}: {people: PersonOption[]}) {
  const {getToken, isLoaded} = useAuth()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [pending, setPending] = useState<ClaimRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [claimNote, setClaimNote] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [howConnected, setHowConnected] = useState('')

  const tokenFn = useCallback(() => getToken(), [getToken])

  const load = useCallback(async () => {
    setError(null)
    try {
      const profile = await apiFetch<MeResponse>('/me', {getAccessToken: tokenFn})
      setMe(profile)
      setDisplayName(profile.displayName)
      setHowConnected(profile.howConnected ?? '')
      const mine = await apiFetch<{claims: ClaimRow[]}>('/claims', {
        getAccessToken: tokenFn,
      })
      setClaims(mine.claims)
      if (profile.role === 'editor' || profile.role === 'admin') {
        const queue = await apiFetch<{claims: ClaimRow[]}>('/claims/pending', {
          getAccessToken: tokenFn,
        })
        setPending(queue.claims)
      } else {
        setPending([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile')
    }
  }, [tokenFn])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people.slice(0, 40)
    return people
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.role ?? '').toLowerCase().includes(q) ||
          (p.yearsActive ?? '').toLowerCase().includes(q)
      )
      .slice(0, 40)
  }, [people, query])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/me', {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {displayName, howConnected},
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPersonId) return
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/claims', {
        method: 'POST',
        getAccessToken: tokenFn,
        body: {sanityPersonId: selectedPersonId, note: claimNote || undefined},
      })
      setClaimNote('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setSaving(false)
    }
  }

  async function reviewClaim(id: string, status: 'approved' | 'rejected') {
    setSaving(true)
    try {
      await apiFetch(`/claims/${id}`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {status},
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setSaving(false)
    }
  }

  const personName = (id: string) => people.find((p) => p._id === id)?.name ?? id

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <p className="rail-title">Your place in the archive</p>
      <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Profile</h1>
      <p className="mt-5 text-xl leading-relaxed text-ink-soft">
        Update how you are connected, and claim your historical person card if it is already in
        the roster.
      </p>

      {error ? <p className="mt-6 text-base text-red-800">{error}</p> : null}

      {!me ? (
        <p className="mt-10 text-lg text-ink-soft">Loading…</p>
      ) : (
        <>
          <form onSubmit={saveProfile} className="mt-10 space-y-5 border-t border-rule pt-10">
            <div>
              <label htmlFor="displayName" className="rail-title">
                Display name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
                required
              />
            </div>
            <div>
              <label htmlFor="howConnected" className="rail-title">
                How were you connected?
              </label>
              <input
                id="howConnected"
                value={howConnected}
                onChange={(e) => setHowConnected(e.target.value)}
                placeholder="e.g. Insectary 1984–89 · grew up on Cotonou compound · spouse of…"
                className="mt-2 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
              />
            </div>
            <p className="text-sm text-ink-faint">
              Role: {me.role}
              {me.email ? ` · ${me.email}` : ''}
            </p>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>

          <section className="mt-14 border-t border-rule pt-10">
            <h2 className="story-title text-2xl">This is me</h2>
            <p className="mt-3 text-lg text-ink-soft">
              Search the historical roster and claim the card that is you. An editor may glance at
              it — we keep that light.
            </p>
            <form onSubmit={submitClaim} className="mt-6 space-y-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
              />
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
                required
              >
                <option value="">Choose a person…</option>
                {filtered.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                    {p.role ? ` — ${p.role}` : ''}
                    {p.yearsActive ? ` (${p.yearsActive})` : ''}
                  </option>
                ))}
              </select>
              <textarea
                value={claimNote}
                onChange={(e) => setClaimNote(e.target.value)}
                rows={3}
                placeholder="Optional note — why this is you"
                className="w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
              />
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                Submit claim
              </button>
            </form>

            {claims.length ? (
              <ul className="mt-8 space-y-3">
                {claims.map((c) => (
                  <li key={c.id} className="border border-rule bg-paper-2 px-4 py-3 text-base">
                    <span className="font-medium">{personName(c.sanityPersonId)}</span>
                    <span className="text-ink-soft"> · {c.status}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {pending.length ? (
            <section className="mt-14 border-t border-rule pt-10">
              <h2 className="story-title text-2xl">Pending claims</h2>
              <ul className="mt-6 space-y-4">
                {pending.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-rule px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{personName(c.sanityPersonId)}</p>
                      {c.note ? <p className="text-sm text-ink-soft">{c.note}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={saving}
                        onClick={() => reviewClaim(c.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="nav-link min-h-10 border border-rule px-3"
                        disabled={saving}
                        onClick={() => reviewClaim(c.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mt-12 text-base text-ink-soft">
            Ready with a story?{' '}
            <Link href="/contribute" className="underline decoration-rule hover:text-accent">
              Share one with the archive
            </Link>
            .
          </p>
        </>
      )}
    </main>
  )
}
