'use client'

import {useCallback, useEffect, useState} from 'react'
import {SignInButton, useAuth, useUser} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import {Button, EmptyState, PageHeader} from '@/components/ui'
import {
  ContributeModeTabs,
  type ContributeMode,
} from '@/components/contribute/ContributeModeTabs'
import {VoiceContribute} from '@/components/contribute/VoiceContribute'
import {WriteContribute} from '@/components/contribute/WriteContribute'

type HealthResponse = {
  authMode?: 'clerk' | 'dev-bypass' | 'unconfigured'
}

export default function ContributePage() {
  const {getToken, isLoaded, isSignedIn} = useAuth()
  const {user} = useUser()
  const tokenFn = useCallback(() => getToken(), [getToken])

  const [mode, setMode] = useState<ContributeMode>('voice')
  const [authMode, setAuthMode] = useState<HealthResponse['authMode'] | 'loading'>('loading')

  useEffect(() => {
    let cancelled = false
    apiFetch<HealthResponse>('/health')
      .then((data) => {
        if (!cancelled) setAuthMode(data.authMode ?? 'unconfigured')
      })
      .catch(() => {
        if (!cancelled) setAuthMode('unconfigured')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const devBypass = authMode === 'dev-bypass'
  const canContribute = Boolean(isSignedIn) || devBypass
  const checkingAuth = !isLoaded || authMode === 'loading'
  const userLabel =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || (devBypass ? 'Dev Community Friend' : undefined)

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <PageHeader
        title="Share a story from the compound"
        subtitle="Families welcome — staff, spouses, kids who grew up on station, national-programme friends. Two paragraphs count."
      />

      {checkingAuth ? (
        <div className="mt-8 space-y-3" aria-live="polite" aria-busy="true">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      ) : !canContribute ? (
        <EmptyState
          icon="compose"
          title="Sign in to share a story"
          action={
            <SignInButton mode="modal" forceRedirectUrl="/contribute">
              <Button variant="primary">Sign in to contribute</Button>
            </SignInButton>
          }
        >
          Stories are saved under your account so an editor knows who to credit and thank.
        </EmptyState>
      ) : (
        <>
          <ContributeModeTabs value={mode} onValueChange={setMode} />
          {mode === 'voice' ? (
            <VoiceContribute getAccessToken={tokenFn} />
          ) : (
            <WriteContribute getAccessToken={tokenFn} userLabel={userLabel} />
          )}
        </>
      )}
    </main>
  )
}
