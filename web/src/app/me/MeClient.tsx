'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import Link from 'next/link'
import {useAuth, useUser} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import type {MeResponse} from '@biologicalcontrol/shared'
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  EmptyState,
  Icon,
  LoadingRegion,
  Skeleton,
  TabPanel,
  Tabs,
  type TabItem,
} from '@/components/ui'
import {ProfileHeader, ProfileHeaderSkeleton} from '@/components/profile/ProfileHeader'
import {rosterFacts, type RosterPerson} from '@/components/profile/roster'

type ClaimRow = {
  id: string
  sanityPersonId: string
  status: string
  note?: string | null
}

type TabId = 'stories' | 'photos' | 'about'

const TABS: ReadonlyArray<TabItem<TabId>> = [
  {id: 'stories', label: 'Stories'},
  {id: 'photos', label: 'Photos'},
  {id: 'about', label: 'About'},
]

const ROLE_LABEL: Record<string, string> = {
  editor: 'Editor',
  admin: 'Administrator',
}

export function MeClient({roster}: {roster: RosterPerson[]}) {
  const {getToken, isLoaded} = useAuth()
  const {user} = useUser()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [failed, setFailed] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [tab, setTab] = useState<TabId>('stories')

  const tokenFn = useCallback(() => getToken(), [getToken])

  const load = useCallback(async () => {
    try {
      const profile = await apiFetch<MeResponse>('/me', {getAccessToken: tokenFn})
      setMe(profile)
      setFailed(false)
      try {
        const mine = await apiFetch<{claims: ClaimRow[]}>('/claims', {getAccessToken: tokenFn})
        setClaims(mine.claims ?? [])
      } catch {
        // A claim list that will not load must not blank out the profile above it.
        setClaims([])
      }
    } catch {
      setFailed(true)
    }
  }, [tokenFn])

  const retry = useCallback(async () => {
    setReloading(true)
    await load()
    setReloading(false)
  }, [load])

  useEffect(() => {
    if (isLoaded) void load()
  }, [isLoaded, load])

  const byId = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster])

  const approvedPerson = me?.approvedClaimPersonId ? byId.get(me.approvedClaimPersonId) : undefined
  const approvedUnknown = Boolean(me?.approvedClaimPersonId) && !approvedPerson
  const pendingClaim = claims.find((c) => c.status === 'pending')
  const pendingPerson = pendingClaim ? byId.get(pendingClaim.sanityPersonId) : undefined

  const displayName = me?.displayName || user?.fullName || user?.username || 'Your profile'
  const roleLabel = me ? ROLE_LABEL[me.role] : undefined

  if (!isLoaded || (!me && !failed)) {
    return (
      <main className="container container-narrow py-8 md:py-12">
        <LoadingRegion label="Loading your profile">
          <ProfileHeaderSkeleton />
          <Skeleton className="mt-10 h-20 w-full rounded-md" />
          <Skeleton className="mt-8 h-11 w-full" />
          <Skeleton className="mt-6 h-40 w-full rounded-md" />
        </LoadingRegion>
      </main>
    )
  }

  if (failed || !me) {
    return (
      <main className="container container-narrow py-8 md:py-12">
        <ProfileHeader
          media={<Avatar name={user?.fullName ?? undefined} src={user?.imageUrl} size="xl" ring />}
          name={displayName}
        />
        <Alert tone="error" className="mt-8">
          Your profile did not load. The archive may be offline for a moment — try again, and if it
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
      <ProfileHeader
        media={<Avatar name={displayName} src={user?.imageUrl} size="xl" ring />}
        name={displayName}
        eyebrow={roleLabel}
        note={
          me.howConnected || (
            <>
              You have not said how you were connected to the programme yet.{' '}
              <Link href="/settings" className="underline decoration-rule hover:text-accent">
                Add a line about yourself
              </Link>
              .
            </>
          )
        }
        actions={
          <>
            <ButtonLink href="/settings" variant="secondary" icon="edit">
              Edit profile
            </ButtonLink>
            <ButtonLink href="/contribute" variant="primary" icon="compose">
              Share a story
            </ButtonLink>
          </>
        }
      />

      {approvedPerson ? (
        <Link
          href={`/people/${approvedPerson.slug}`}
          className="card card--interactive mt-8 flex items-center gap-4 p-4"
        >
          <Avatar name={approvedPerson.name} src={approvedPerson.portraitUrl} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block text-[1.0625rem] font-semibold text-ink">
              Your page in the archive
            </span>
            <span className="meta-line truncate-1 block">
              {[approvedPerson.name, rosterFacts(approvedPerson)].filter(Boolean).join(' — ')}
            </span>
          </span>
          <span className="shrink-0 text-ink-faint">
            <Icon name="forward" size={20} />
          </span>
        </Link>
      ) : approvedUnknown ? (
        <p className="meta-line mt-8">
          Your claim to a card in the roster is approved, but that card is not loading right now.
        </p>
      ) : pendingClaim ? (
        <p className="meta-line mt-8">
          Waiting on an editor to confirm that {pendingPerson?.name ?? 'the card you chose'} is you.
        </p>
      ) : (
        <section className="card mt-8 p-5">
          <h2 className="text-[1.1875rem] font-bold tracking-[-0.02em] text-ink">
            Are you already in the archive?
          </h2>
          <p className="mt-2 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            Many people from the programme already have a card here, written from annual reports.
            Find yours and tell us it is you — an editor confirms it, and the card becomes your page.
          </p>
          <div className="mt-4">
            <ButtonLink href="/settings" variant="secondary" icon="search">
              Find your card
            </ButtonLink>
          </div>
        </section>
      )}

      <Tabs
        items={TABS}
        value={tab}
        onValueChange={setTab}
        label="Your profile"
        className="mt-10"
      />

      <div className="mt-6">
        <TabPanel id="stories" active={tab === 'stories'}>
          <EmptyState
            icon="stories"
            title="No stories are linked to you yet"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href="/contribute" variant="primary" icon="compose">
                  Share a story
                </ButtonLink>
                {approvedPerson ? (
                  <ButtonLink href={`/people/${approvedPerson.slug}`} variant="secondary">
                    View your archive page
                  </ButtonLink>
                ) : null}
              </div>
            }
          >
            {approvedPerson
              ? 'Send a memory and an editor publishes it. Stories that already name you are listed on your archive page.'
              : 'Send a memory and an editor publishes it to the archive under your name.'}
          </EmptyState>
        </TabPanel>

        <TabPanel id="photos" active={tab === 'photos'}>
          <EmptyState
            icon="photos"
            title="No photographs are linked to you yet"
            action={
              <ButtonLink href="/contribute" variant="primary" icon="camera">
                Send photographs
              </ButtonLink>
            }
          >
            Photographs live in the archive galleries. Send yours — with names, if you remember them
            — and an editor adds them to a gallery.
          </EmptyState>
        </TabPanel>

        <TabPanel id="about" active={tab === 'about'}>
          <dl className="border-t border-rule">
            <AboutRow term="How you are connected">
              {me.howConnected || (
                <span className="text-ink-faint">Not written yet</span>
              )}
            </AboutRow>
            <AboutRow term="Display name">{me.displayName}</AboutRow>
            <AboutRow term="Email address">
              {me.email || user?.primaryEmailAddress?.emailAddress || (
                <span className="text-ink-faint">Not on file</span>
              )}
            </AboutRow>
            <AboutRow term="Role in the archive">
              {roleLabel ?? 'Community member'}
            </AboutRow>
            <AboutRow term="Card in the archive">
              {approvedPerson ? (
                <Link
                  href={`/people/${approvedPerson.slug}`}
                  className="underline decoration-rule hover:text-accent"
                >
                  {approvedPerson.name}
                </Link>
              ) : pendingClaim ? (
                `${pendingPerson?.name ?? 'A card'} — waiting for an editor`
              ) : (
                <span className="text-ink-faint">Not claimed</span>
              )}
            </AboutRow>
          </dl>
          <div className="mt-6">
            <ButtonLink href="/settings" variant="secondary" icon="edit">
              Edit these details
            </ButtonLink>
          </div>
        </TabPanel>
      </div>
    </main>
  )
}

function AboutRow({term, children}: {term: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1 border-b border-rule py-4 sm:flex-row sm:gap-6">
      <dt className="shrink-0 text-[1rem] font-semibold text-ink sm:w-56">{term}</dt>
      <dd className="min-w-0 text-[1.0625rem] leading-relaxed text-ink-soft [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  )
}
