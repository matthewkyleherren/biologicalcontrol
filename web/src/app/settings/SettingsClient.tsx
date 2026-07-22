'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useAuth, useClerk, useUser} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import type {MeResponse} from '@biologicalcontrol/shared'
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  LoadingRegion,
  PageHeader,
  SearchInput,
  Skeleton,
  TextField,
} from '@/components/ui'
import {AppearanceSection} from '@/components/profile/AppearanceSection'
import {rosterFacts, type RosterPerson} from '@/components/profile/roster'

type ClaimRow = {
  id: string
  sanityPersonId: string
  status: string
  note?: string | null
}

const CLAIM_STATUS: Record<string, string> = {
  pending: 'Waiting for an editor',
  approved: 'Approved — this card is yours',
  rejected: 'Not approved',
  revoked: 'Withdrawn',
}

/** How many roster rows to show before asking for a narrower search. */
const RESULT_LIMIT = 20

export function SettingsClient({roster}: {roster: RosterPerson[]}) {
  const {getToken, isLoaded} = useAuth()
  const {user} = useUser()
  const {signOut} = useClerk()
  const router = useRouter()

  const [me, setMe] = useState<MeResponse | null>(null)
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloading, setReloading] = useState(false)

  // Your details
  const [displayName, setDisplayName] = useState('')
  const [howConnected, setHowConnected] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [connectedError, setConnectedError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Your card in the archive
  const [query, setQuery] = useState('')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSent, setClaimSent] = useState<string | null>(null)

  // Pending claims (editors and admins only)
  const [pending, setPending] = useState<ClaimRow[]>([])
  const [canReview, setCanReview] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const tokenFn = useCallback(() => getToken(), [getToken])

  const loadClaims = useCallback(
    async (role: string) => {
      try {
        const mine = await apiFetch<{claims: ClaimRow[]}>('/claims', {getAccessToken: tokenFn})
        setClaims(mine.claims ?? [])
      } catch {
        setClaims([])
      }

      if (role !== 'editor' && role !== 'admin') {
        setCanReview(false)
        setPending([])
        return
      }
      try {
        const queue = await apiFetch<{claims: ClaimRow[]}>('/claims/pending', {
          getAccessToken: tokenFn,
        })
        setPending(queue.claims ?? [])
        setCanReview(true)
      } catch {
        // `/claims/pending` answers 403 to community members. That is the normal
        // case, not an error worth showing anyone — the section simply hides.
        setCanReview(false)
        setPending([])
      }
    },
    [tokenFn]
  )

  const load = useCallback(async () => {
    try {
      const profile = await apiFetch<MeResponse>('/me', {getAccessToken: tokenFn})
      setMe(profile)
      setDisplayName(profile.displayName)
      setHowConnected(profile.howConnected ?? '')
      setLoadFailed(false)
      await loadClaims(profile.role)
    } catch {
      setLoadFailed(true)
    }
  }, [loadClaims, tokenFn])

  const retry = useCallback(async () => {
    setReloading(true)
    await load()
    setReloading(false)
  }, [load])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  const byId = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster])
  const claimByPersonId = useMemo(
    () => new Map(claims.map((c) => [c.sanityPersonId, c])),
    [claims]
  )

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.role ?? '').toLowerCase().includes(q) ||
        (p.yearsActive ?? '').toLowerCase().includes(q) ||
        (p.location ?? '').toLowerCase().includes(q)
    )
  }, [query, roster])

  const visible = matches.slice(0, RESULT_LIMIT)

  const dirty =
    Boolean(me) && (displayName !== me!.displayName || howConnected !== (me!.howConnected ?? ''))

  function validate(): boolean {
    const name = displayName.trim()
    let ok = true
    if (!name) {
      setNameError('Enter the name you would like colleagues to see.')
      ok = false
    } else if (name.length > 120) {
      setNameError('That name is longer than 120 characters. Shorten it and save again.')
      ok = false
    } else {
      setNameError(null)
    }
    if (howConnected.length > 500) {
      setConnectedError('That line is longer than 500 characters. Shorten it and save again.')
      ok = false
    } else {
      setConnectedError(null)
    }
    return ok
  }

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault()
    setSaved(false)
    setSaveError(null)
    if (!validate()) return

    setSaving(true)
    try {
      await apiFetch('/me', {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {displayName: displayName.trim(), howConnected: howConnected.trim()},
      })
      await load()
      setSaved(true)
    } catch {
      setSaveError('Your details were not saved. Check your connection and save again.')
    } finally {
      setSaving(false)
    }
  }

  async function claimPerson(person: RosterPerson) {
    setClaimError(null)
    setClaimSent(null)
    setClaimingId(person.id)
    try {
      await apiFetch('/claims', {
        method: 'POST',
        getAccessToken: tokenFn,
        body: {sanityPersonId: person.id},
      })
      setClaimSent(person.name)
      if (me) await loadClaims(me.role)
    } catch (err) {
      const text = err instanceof Error ? err.message : ''
      setClaimError(
        text.includes('already claimed')
          ? `${person.name} is already claimed by someone else. If that card is really you, write to an editor and they will sort it out.`
          : `Your message about ${person.name} did not send. Check your connection and try again.`
      )
    } finally {
      setClaimingId(null)
    }
  }

  async function reviewClaim(claim: ClaimRow, status: 'approved' | 'rejected') {
    setReviewError(null)
    setReviewingId(claim.id)
    try {
      await apiFetch(`/claims/${claim.id}`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {status},
      })
      if (me) await loadClaims(me.role)
    } catch (err) {
      const text = err instanceof Error ? err.message : ''
      setReviewError(
        text.includes('already exists')
          ? 'Another approved claim already exists for that card. Revoke it first, then approve this one.'
          : 'That decision was not recorded. Check your connection and try again.'
      )
    } finally {
      setReviewingId(null)
    }
  }

  const email = me?.email || user?.primaryEmailAddress?.emailAddress || null

  if (!isLoaded || (!me && !loadFailed)) {
    return (
      <main className="container container-narrow py-8 md:py-12">
        <PageHeader title="Settings" subtitle="Your details, your card in the archive, and how this site looks." />
        <LoadingRegion label="Loading your settings">
          <Skeleton className="mt-6 h-24 w-full rounded-md" />
          <Skeleton className="mt-4 h-24 w-full rounded-md" />
          <Skeleton className="mt-8 h-12 w-full rounded-full" />
          <Skeleton className="mt-4 h-40 w-full rounded-md" />
        </LoadingRegion>
      </main>
    )
  }

  if (loadFailed || !me) {
    return (
      <main className="container container-narrow py-8 md:py-12">
        <PageHeader title="Settings" />
        <Alert tone="error" className="mt-4">
          Your settings did not load. The archive may be offline for a moment — try again, and if it
          keeps failing, write to an editor.
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" loading={reloading} onClick={() => void retry()}>
            Try again
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="container container-narrow py-8 md:py-12">
      <PageHeader
        title="Settings"
        subtitle="Your details, your card in the archive, and how this site looks."
        action={
          <ButtonLink href="/me" variant="ghost" icon="user">
            Your profile
          </ButtonLink>
        }
      />

      {/* --- Your details --------------------------------------------------- */}
      <section aria-labelledby="settings-details" className="border-t border-rule pt-8">
        <h2 id="settings-details" className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">
          Your details
        </h2>
        <p className="mt-2 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          This is what colleagues see beside your stories and messages.
        </p>

        <form onSubmit={saveDetails} className="mt-5 space-y-5" noValidate>
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => {
              if (displayName.trim()) setNameError(null)
            }}
            error={nameError}
            help="Your name as colleagues knew it — nicknames are fine."
            autoComplete="name"
            aria-required="true"
            maxLength={160}
          />
          <TextField
            label="How you were connected"
            value={howConnected}
            onChange={(e) => setHowConnected(e.target.value)}
            error={connectedError}
            optional
            help="One line — for example: insectary technician, Cotonou, 1984–89."
            maxLength={600}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
            {dirty && !saving ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setDisplayName(me.displayName)
                  setHowConnected(me.howConnected ?? '')
                  setNameError(null)
                  setConnectedError(null)
                  setSaved(false)
                  setSaveError(null)
                }}
              >
                Undo changes
              </Button>
            ) : null}
          </div>
          {saved && !dirty ? (
            <Alert tone="success">Saved. Colleagues now see these details.</Alert>
          ) : null}
          {saveError ? <Alert tone="error">{saveError}</Alert> : null}
        </form>
      </section>

      {/* --- Your card in the archive --------------------------------------- */}
      <section aria-labelledby="settings-claim" className="mt-10 border-t border-rule pt-8">
        <h2 id="settings-claim" className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">
          Your card in the archive
        </h2>
        <p className="mt-2 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          People from the programme already have cards here, written from annual reports and
          photographs. Find yours and say so — an editor confirms it, then the card becomes your
          page.
        </p>

        {claims.length ? (
          <ul className="mt-5 list">
            {claims.map((claim) => {
              const person = byId.get(claim.sanityPersonId)
              return (
                <li key={claim.id} className="list-row">
                  <Avatar name={person?.name} src={person?.portraitUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] font-semibold text-ink">
                      {person?.name ?? 'A card in the roster'}
                    </span>
                    <span className="meta-line block">
                      {CLAIM_STATUS[claim.status] ?? claim.status}
                    </span>
                  </span>
                  {claim.status === 'approved' && person ? (
                    <Link
                      href={`/people/${person.slug}`}
                      className="shrink-0 text-[1rem] underline decoration-rule hover:text-accent"
                    >
                      View page
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}

        {claimSent ? (
          <Alert tone="success" className="mt-5">
            Sent. An editor will confirm that {claimSent} is you, usually within a few days.
          </Alert>
        ) : null}
        {claimError ? (
          <Alert tone="error" className="mt-5">
            {claimError}
          </Alert>
        ) : null}

        {roster.length ? (
          <>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              label="Search the roster by name, role, station, or years"
              placeholder="Search by name…"
              className="mt-5"
            />
            <p className="meta-line mt-2" aria-live="polite">
              {query.trim()
                ? `${matches.length} of ${roster.length} people match “${query.trim()}”`
                : `${roster.length} people in the roster`}
              {matches.length > RESULT_LIMIT ? ` · showing the first ${RESULT_LIMIT}` : ''}
            </p>

            {matches.length ? (
              <ul className="mt-2 list">
                {visible.map((person) => {
                  const claim = claimByPersonId.get(person.id)
                  const facts = rosterFacts(person)
                  return (
                    <li key={person.id} className="list-row gap-3">
                      <Avatar name={person.name} src={person.portraitUrl} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1.0625rem] font-semibold text-ink">
                          {person.name}
                        </span>
                        {facts ? <span className="meta-line block">{facts}</span> : null}
                      </span>
                      {claim ? (
                        <span className="meta-line shrink-0 text-right">
                          {CLAIM_STATUS[claim.status] ?? claim.status}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          loading={claimingId === person.id}
                          disabled={Boolean(claimingId)}
                          onClick={() => void claimPerson(person)}
                        >
                          This is me
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon="search"
                  title="No one in the roster matches that"
                  action={
                    <Button variant="secondary" onClick={() => setQuery('')}>
                      Clear the search
                    </Button>
                  }
                >
                  Try a surname on its own, or a station such as Cotonou. If your card is not here
                  yet, send a story and an editor will add you.
                </EmptyState>
              </div>
            )}
          </>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon="people"
              title="The roster did not load"
              action={
                <ButtonLink href="/people" variant="secondary">
                  Open the people directory
                </ButtonLink>
              }
            >
              The list of historical cards is unavailable at the moment. Reload the page in a minute
              and it should be back.
            </EmptyState>
          </div>
        )}
      </section>

      {/* --- Pending claims (editors and admins) ---------------------------- */}
      {canReview ? (
        <section aria-labelledby="settings-pending" className="mt-10 border-t border-rule pt-8">
          <h2
            id="settings-pending"
            className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink"
          >
            Pending claims
          </h2>
          <p className="mt-2 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            People who have said a card in the roster is them. Approving one links their account to
            that page.
          </p>

          {reviewError ? (
            <Alert tone="error" className="mt-5">
              {reviewError}
            </Alert>
          ) : null}

          {pending.length ? (
            <ul className="mt-5 list">
              {pending.map((claim) => {
                const person = byId.get(claim.sanityPersonId)
                return (
                  <li key={claim.id} className="list-row flex-wrap gap-3">
                    <Avatar name={person?.name} src={person?.portraitUrl} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] font-semibold text-ink">
                        {person?.name ?? claim.sanityPersonId}
                      </span>
                      {claim.note ? (
                        <span className="meta-line block">{claim.note}</span>
                      ) : person ? (
                        <span className="meta-line block">{rosterFacts(person)}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <Button
                        loading={reviewingId === claim.id}
                        disabled={Boolean(reviewingId)}
                        onClick={() => void reviewClaim(claim, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={Boolean(reviewingId)}
                        onClick={() => void reviewClaim(claim, 'rejected')}
                      >
                        Reject
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState icon="check" title="No claims are waiting">
                When someone says a card in the roster is them, it appears here for you to confirm.
              </EmptyState>
            </div>
          )}
        </section>
      ) : null}

      {/* --- Appearance ------------------------------------------------------ */}
      <section aria-labelledby="settings-appearance" className="mt-10 border-t border-rule pt-8">
        <h2
          id="settings-appearance"
          className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink"
        >
          Appearance
        </h2>
        <p className="mt-2 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          Default is the readable one. Typewriter and 1994 are an easter egg — they restyle the whole
          site as a joke, and everything still works. Your choice is remembered in this browser only.
        </p>
        <AppearanceSection />
      </section>

      {/* --- Account --------------------------------------------------------- */}
      <section aria-labelledby="settings-account" className="mt-10 border-t border-rule pt-8">
        <h2 id="settings-account" className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">
          Account
        </h2>
        <dl className="mt-5 border-t border-rule">
          <div className="flex flex-col gap-1 border-b border-rule py-4 sm:flex-row sm:gap-6">
            <dt className="shrink-0 text-[1rem] font-semibold text-ink sm:w-56">Email address</dt>
            <dd className="min-w-0 text-[1.0625rem] text-ink-soft [overflow-wrap:anywhere]">
              {email ?? <span className="text-ink-faint">Not on file</span>}
              <span className="meta-line mt-1 block">
                This comes from how you sign in and cannot be changed here.
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-rule py-4 sm:flex-row sm:gap-6">
            <dt className="shrink-0 text-[1rem] font-semibold text-ink sm:w-56">
              Role in the archive
            </dt>
            <dd className="min-w-0 text-[1.0625rem] text-ink-soft">
              {me.role === 'admin'
                ? 'Administrator'
                : me.role === 'editor'
                  ? 'Editor'
                  : 'Community member'}
            </dd>
          </div>
        </dl>
        <div className="mt-5">
          <Button
            variant="secondary"
            icon="signout"
            onClick={() => void signOut(() => router.push('/'))}
          >
            Sign out
          </Button>
        </div>
      </section>
    </main>
  )
}
