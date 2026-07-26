'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {useAuth} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import type {RosterPerson} from '@/components/profile/roster'
import {rosterFacts} from '@/components/profile/roster'
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  TabPanel,
  Tabs,
  type TabItem,
} from '@/components/ui'

type TabId = 'overview' | 'members' | 'claims' | 'stories'

type Overview = {
  members: {
    total: number
    newLast7Days: number
    newLast30Days: number
    activeLast7Days: number
  }
  queue: {
    pendingClaims: number
    pendingStories: number | null
    voiceDraftsSubmitted: number
  }
  archive: {
    publicStories: number | null
  }
  traffic: {
    pageViewsLast7Days: number
    pageViewsLast30Days: number
    loginsLast7Days: number
    note: string
  }
}

type AdminUser = {
  id: string
  displayName: string
  email: string | null
  role: 'community' | 'editor' | 'admin'
  locale: string
  createdAt: string
  lastSeenAt: string | null
  howConnected: string | null
}

type AdminClaim = {
  id: string
  userId: string
  sanityPersonId: string
  status: string
  note: string | null
  createdAt: string
  displayName: string
  email: string | null
  personName: string | null
  personSlug: string | null
}

type PendingStory = {
  _id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  year: number | null
  location: string | null
  era: string | null
  reviewStatus: string | null
  createdAt: string | null
  bodyText: string | null
}

const TABS: ReadonlyArray<TabItem<TabId>> = [
  {id: 'overview', label: 'Overview'},
  {id: 'members', label: 'Members'},
  {id: 'claims', label: 'Claims'},
  {id: 'stories', label: 'Stories'},
]

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  community: 'Community',
  editor: 'Editor',
  admin: 'Admin',
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function tabFromSearch(search: string): TabId {
  const value = new URLSearchParams(search).get('tab')
  if (value === 'members' || value === 'claims' || value === 'stories' || value === 'overview') {
    return value
  }
  return 'overview'
}

export function AdminClient({roster}: {roster: RosterPerson[]}) {
  const {getToken, isLoaded} = useAuth()
  const tokenFn = useCallback(() => getToken(), [getToken])

  const [tab, setTab] = useState<TabId>('overview')

  useEffect(() => {
    setTab(tabFromSearch(window.location.search))
  }, [])
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [stories, setStories] = useState<PendingStory[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const byPersonId = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster])

  const setTabAndUrl = useCallback((next: TabId) => {
    setTab(next)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (next === 'overview') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url.pathname + url.search)
  }, [])

  const load = useCallback(async () => {
    if (!isLoaded) return
    setStatus('loading')
    setMessage('')
    try {
      const [overviewData, usersData, claimsData, storiesData] = await Promise.all([
        apiFetch<Overview>('/admin/overview', {getAccessToken: tokenFn}),
        apiFetch<{users: AdminUser[]}>('/admin/users', {getAccessToken: tokenFn}),
        apiFetch<{claims: AdminClaim[]}>('/admin/claims?status=pending', {
          getAccessToken: tokenFn,
        }),
        apiFetch<{stories: PendingStory[]}>('/stories/pending', {getAccessToken: tokenFn}),
      ])
      setOverview(overviewData)
      setUsers(usersData.users ?? [])
      setClaims(claimsData.claims ?? [])
      setStories(storiesData.stories ?? [])
      setStatus('ready')
    } catch (err) {
      const text = errorMessage(err, 'Could not load admin.')
      if (/403|admin role/i.test(text)) {
        setStatus('forbidden')
        setMessage('This section is for administrators.')
      } else {
        setStatus('error')
        setMessage(text)
      }
    }
  }, [isLoaded, tokenFn])

  useEffect(() => {
    void load()
  }, [load])

  async function setUserRole(userId: string, role: AdminUser['role']) {
    setBusyKey(`role:${userId}`)
    setMessage('')
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {role},
      })
      setUsers((prev) => prev.map((row) => (row.id === userId ? {...row, role} : row)))
    } catch (err) {
      setMessage(errorMessage(err, 'Could not update that member.'))
    } finally {
      setBusyKey(null)
    }
  }

  async function reviewClaim(id: string, next: 'approved' | 'rejected') {
    setBusyKey(`claim:${id}`)
    setMessage('')
    try {
      await apiFetch(`/claims/${id}`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {status: next},
      })
      setClaims((prev) => prev.filter((claim) => claim.id !== id))
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              queue: {
                ...prev.queue,
                pendingClaims: Math.max(0, prev.queue.pendingClaims - 1),
              },
            }
          : prev
      )
    } catch (err) {
      setMessage(errorMessage(err, 'Could not update that claim.'))
    } finally {
      setBusyKey(null)
    }
  }

  async function reviewStory(id: string, next: 'approved' | 'rejected') {
    setBusyKey(`story:${id}`)
    setMessage('')
    try {
      await apiFetch(`/stories/${id}/review`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {status: next},
      })
      setStories((prev) => prev.filter((story) => story._id !== id))
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              queue: {
                ...prev.queue,
                pendingStories:
                  typeof prev.queue.pendingStories === 'number'
                    ? Math.max(0, prev.queue.pendingStories - 1)
                    : prev.queue.pendingStories,
              },
              archive: {
                publicStories:
                  next === 'approved' && typeof prev.archive.publicStories === 'number'
                    ? prev.archive.publicStories + 1
                    : prev.archive.publicStories,
              },
            }
          : prev
      )
    } catch (err) {
      setMessage(errorMessage(err, 'Could not update that story.'))
    } finally {
      setBusyKey(null)
    }
  }

  const tabItems = useMemo(
    () =>
      TABS.map((item) => {
        if (item.id === 'claims') return {...item, count: claims.length}
        if (item.id === 'stories') return {...item, count: stories.length}
        return item
      }),
    [claims.length, stories.length]
  )

  return (
    <main className="container container-narrow py-8 md:py-12">
      <PageHeader
        title="Admin"
        subtitle="New members, person claims, story review, and archive activity."
        action={
          status === 'ready' ? (
            <Button variant="ghost" onClick={() => void load()}>
              Refresh
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' ? (
        <p className="mt-8 text-lg text-ink-soft">Loading admin…</p>
      ) : null}

      {status === 'forbidden' ? (
        <div className="mt-8">
          <EmptyState icon="alert" title="Administrators only">
            Ask an existing admin to promote your account if you should manage the archive.
          </EmptyState>
          <div className="mt-6">
            <ButtonLink href="/me" variant="secondary">
              Back to your profile
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="mt-8 space-y-4">
          <Alert tone="error">{message}</Alert>
          <Button variant="secondary" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div className="mt-8">
          {message ? <Alert tone="error" className="mb-6">{message}</Alert> : null}

          <Tabs
            items={tabItems}
            value={tab}
            onValueChange={setTabAndUrl}
            label="Admin sections"
          />

          <div className="mt-6">
            <TabPanel id="overview" active={tab === 'overview'}>
              {overview ? <OverviewPanel overview={overview} /> : null}
            </TabPanel>

            <TabPanel id="members" active={tab === 'members'}>
              {users.length === 0 ? (
                <EmptyState icon="people" title="No members yet">
                  When someone signs up, they appear here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-rule border-t border-rule">
                  {users.map((row) => (
                    <li key={row.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[1.125rem] font-semibold text-ink">{row.displayName}</p>
                        <p className="meta-line mt-1">
                          {[row.email, ROLE_LABEL[row.role], `Joined ${formatWhen(row.createdAt)}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="meta-line mt-1">
                          Last seen {formatWhen(row.lastSeenAt)}
                          {row.howConnected ? ` · ${row.howConnected}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.role !== 'admin' ? (
                          <Button
                            variant="primary"
                            loading={busyKey === `role:${row.id}`}
                            onClick={() => void setUserRole(row.id, 'admin')}
                          >
                            Make admin
                          </Button>
                        ) : (
                          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-faint self-center">
                            Admin
                          </span>
                        )}
                        {row.role === 'community' ? (
                          <Button
                            variant="secondary"
                            disabled={busyKey === `role:${row.id}`}
                            onClick={() => void setUserRole(row.id, 'editor')}
                          >
                            Make editor
                          </Button>
                        ) : null}
                        {row.role === 'editor' ? (
                          <Button
                            variant="secondary"
                            disabled={busyKey === `role:${row.id}`}
                            onClick={() => void setUserRole(row.id, 'community')}
                          >
                            Make community
                          </Button>
                        ) : null}
                        {row.role === 'admin' ? (
                          <Button
                            variant="ghost"
                            disabled={busyKey === `role:${row.id}`}
                            onClick={() => void setUserRole(row.id, 'editor')}
                          >
                            Demote to editor
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>

            <TabPanel id="claims" active={tab === 'claims'}>
              {claims.length === 0 ? (
                <EmptyState icon="check" title="No claims waiting">
                  When someone says a roster card is theirs, it shows up here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-rule border-t border-rule">
                  {claims.map((claim) => {
                    const person: RosterPerson | undefined =
                      byPersonId.get(claim.sanityPersonId) ||
                      (claim.personName
                        ? {
                            id: claim.sanityPersonId,
                            name: claim.personName,
                            slug: claim.personSlug || claim.sanityPersonId,
                            role: null,
                            yearsActive: null,
                            location: null,
                            portraitUrl: null,
                          }
                        : undefined)
                    return (
                      <li key={claim.id} className="space-y-3 py-5">
                        <div>
                          <p className="text-[1.125rem] font-semibold text-ink">
                            {claim.displayName} claims{' '}
                            {person ? (
                              <Link
                                href={`/people/${person.slug}`}
                                className="underline decoration-rule hover:text-accent"
                              >
                                {person.name}
                              </Link>
                            ) : (
                              'a roster card'
                            )}
                          </p>
                          <p className="meta-line mt-1">
                            {[
                              claim.email,
                              formatWhen(claim.createdAt),
                              person ? rosterFacts(person) : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {claim.note ? (
                            <p className="mt-2 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
                              {claim.note}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="primary"
                            loading={busyKey === `claim:${claim.id}`}
                            onClick={() => void reviewClaim(claim.id, 'approved')}
                          >
                            Approve claim
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busyKey === `claim:${claim.id}`}
                            onClick={() => void reviewClaim(claim.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </TabPanel>

            <TabPanel id="stories" active={tab === 'stories'}>
              {stories.length === 0 ? (
                <EmptyState icon="check" title="Nothing waiting">
                  Community stories appear here until you approve them for the public archive.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-rule border-t border-rule">
                  {stories.map((story) => (
                    <li key={story._id} className="space-y-3 py-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="story-title text-2xl md:text-3xl">
                          {story.title || 'Untitled story'}
                        </h2>
                        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-faint">
                          Pending
                        </p>
                      </div>
                      <p className="font-mono text-sm text-ink-faint">
                        {[story.year, story.location, story.createdAt?.slice(0, 10)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="max-w-[46ch] text-lg leading-relaxed text-ink-soft whitespace-pre-wrap">
                        {story.bodyText || story.excerpt || 'No text yet.'}
                      </p>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button
                          variant="primary"
                          loading={busyKey === `story:${story._id}`}
                          onClick={() => void reviewStory(story._id, 'approved')}
                        >
                          Approve for archive
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busyKey === `story:${story._id}`}
                          onClick={() => void reviewStory(story._id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function OverviewPanel({overview}: {overview: Overview}) {
  const rows: Array<{label: string; value: string}> = [
    {label: 'Members', value: String(overview.members.total)},
    {label: 'New signups (7 days)', value: String(overview.members.newLast7Days)},
    {label: 'New signups (30 days)', value: String(overview.members.newLast30Days)},
    {label: 'Active members (7 days)', value: String(overview.members.activeLast7Days)},
    {label: 'Pending claims', value: String(overview.queue.pendingClaims)},
    {
      label: 'Pending stories',
      value:
        overview.queue.pendingStories == null ? '—' : String(overview.queue.pendingStories),
    },
    {label: 'Voice drafts submitted', value: String(overview.queue.voiceDraftsSubmitted)},
    {
      label: 'Public stories',
      value:
        overview.archive.publicStories == null ? '—' : String(overview.archive.publicStories),
    },
    {label: 'Page views (7 days)', value: String(overview.traffic.pageViewsLast7Days)},
    {label: 'Page views (30 days)', value: String(overview.traffic.pageViewsLast30Days)},
    {label: 'Logins (7 days)', value: String(overview.traffic.loginsLast7Days)},
  ]

  return (
    <div>
      <dl className="border-t border-rule">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 border-b border-rule py-4 sm:flex-row sm:items-baseline sm:gap-6"
          >
            <dt className="shrink-0 text-[1rem] font-semibold text-ink sm:w-64">{row.label}</dt>
            <dd className="font-mono text-[1.125rem] text-ink-soft">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-faint">
        {overview.traffic.note}
      </p>
    </div>
  )
}
