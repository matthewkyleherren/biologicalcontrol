'use client'

import {useEffect, useState} from 'react'
import {apiFetch} from '@/lib/api'
import {Alert, Button} from '@/components/ui'

type VoiceAgentSession = {
  id: string
  status?: 'idle' | 'active' | 'processing' | 'review' | 'abandoned' | 'completed' | string
  stage?: 'greeting' | 'consent' | 'who' | 'when' | 'where' | 'title' | 'story' | 'confirm' | 'done' | string
  draftId?: string | null
  error?: string | null
}

type CreateSessionResponse = {
  session?: VoiceAgentSession
  sessionId?: string
  clientSecretOrUrl?: string
  stage?: VoiceAgentSession['stage']
  consentRequired?: boolean
}

type GetSessionResponse = {
  session?: VoiceAgentSession
}

type CompleteStoryResponse = {
  session?: VoiceAgentSession
  draftId?: string
}

const STAGE_TEXT: Record<string, string> = {
  greeting: 'Getting ready…',
  consent: 'Confirming consent…',
  who: 'Who is in this story?',
  when: 'About when was this?',
  where: 'Where were you?',
  title: 'What should we call this one?',
  story: 'Tell me the story — take your time.',
  confirm: 'Writing that down…',
  done: 'Writing that down…',
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function isEndpointUnavailable(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('404') || normalized.includes('503') || normalized.includes('not found')
}

export function VoiceOrb({
  consent,
  getAccessToken,
  onDraftId,
  onRecordInstead,
}: {
  consent: boolean
  getAccessToken: () => Promise<string | null>
  onDraftId: (draftId: string) => void
  onRecordInstead: () => void
}) {
  const [session, setSession] = useState<VoiceAgentSession | null>(null)
  const [state, setState] = useState<'idle' | 'connecting' | 'active' | 'working' | 'error'>('idle')
  const [error, setError] = useState('')
  const [fallbackOffered, setFallbackOffered] = useState(false)

  const sessionId = session?.id

  useEffect(() => {
    if (!sessionId || state === 'idle' || state === 'error') return
    async function tick() {
      try {
        const data = await apiFetch<GetSessionResponse>(`/voice-agent/sessions/${sessionId}`, {
          getAccessToken,
        })
        if (data.session) {
          setSession(data.session)
          if (data.session.draftId) onDraftId(data.session.draftId)
          if (data.session.status === 'processing') setState('working')
          if (data.session.status === 'abandoned') {
            setState('idle')
            setSession(null)
          }
        }
      } catch {
        // Polling errors are surfaced by explicit actions; keep the current screen stable.
      }
    }
    const interval = window.setInterval(() => void tick(), 5000)
    return () => window.clearInterval(interval)
  }, [getAccessToken, onDraftId, sessionId, state])

  async function startSession() {
    setError('')
    setFallbackOffered(false)

    if (!consent) {
      setState('error')
      setError('Check the consent box first, then tap to talk.')
      return
    }

    setState('connecting')
    try {
      const data = await apiFetch<CreateSessionResponse>('/voice-agent/sessions', {
        method: 'POST',
        getAccessToken,
        body: {languageHint: 'auto'},
      })
      const id = data.session?.id ?? data.sessionId
      if (!id) {
        throw new Error('The live interviewer did not return a session. Record instead for now.')
      }

      const nextSession: VoiceAgentSession = data.session ?? {
        id,
        status: 'active',
        stage: data.stage ?? 'greeting',
      }
      setSession(nextSession)

      if (!data.clientSecretOrUrl) {
        setState('error')
        setFallbackOffered(true)
        setError(
          'The live interviewer API responded, but the browser voice connection is not ready yet. Record instead for now.'
        )
        return
      }

      setState('active')
      await postEvent(id, {type: 'heartbeat', payload: {consent: true}})
    } catch (err) {
      const message = errorMessage(
        err,
        'The live interviewer could not start. Record the story instead, or write it.'
      )
      setState('error')
      setFallbackOffered(true)
      setError(
        isEndpointUnavailable(message)
          ? 'The live interviewer is not available yet. Record the story instead, or write it.'
          : message
      )
    }
  }

  async function postEvent(id: string, body: unknown) {
    return apiFetch<{session?: VoiceAgentSession}>(`/voice-agent/sessions/${id}/events`, {
      method: 'POST',
      getAccessToken,
      body,
    })
  }

  async function interrupt() {
    if (!sessionId) return
    setError('')
    try {
      const data = await postEvent(sessionId, {type: 'user_text', payload: {text: 'Interrupt'}})
      if (data.session) setSession(data.session)
    } catch (err) {
      setError(errorMessage(err, 'The interviewer did not receive that. You can stop or record instead.'))
      setState('error')
      setFallbackOffered(true)
    }
  }

  async function stopAndComplete() {
    if (!sessionId) return
    setState('working')
    setError('')
    try {
      const data = await apiFetch<CompleteStoryResponse>(
        `/voice-agent/sessions/${sessionId}/complete-story`,
        {
          method: 'POST',
          getAccessToken,
          body: {},
        }
      )
      if (data.draftId) {
        onDraftId(data.draftId)
        return
      }
      if (data.session) setSession(data.session)
      throw new Error('The live interviewer finished, but no review draft is ready yet. Record instead for now.')
    } catch (err) {
      setState('error')
      setFallbackOffered(true)
      setError(
        errorMessage(err, 'The live interviewer could not write this down. Record the story instead.')
      )
    }
  }

  async function abandon() {
    if (!sessionId) {
      setState('idle')
      setError('')
      return
    }
    try {
      await apiFetch(`/voice-agent/sessions/${sessionId}/abandon`, {
        method: 'POST',
        getAccessToken,
        body: {},
      })
    } catch {
      // The UI can still leave the session locally; the server may already be gone.
    } finally {
      setSession(null)
      setState('idle')
      setError('')
    }
  }

  const active = state === 'connecting' || state === 'active' || state === 'working'
  const statusText =
    state === 'idle'
      ? 'Tap to talk.'
      : state === 'connecting'
        ? 'Getting ready…'
        : state === 'working'
          ? 'Writing that down…'
          : STAGE_TEXT[session?.stage ?? ''] || 'Listening.'

  return (
    <section className="space-y-6" aria-labelledby="voice-orb-title">
      <div>
        <p className="rail-title">Talk</p>
        <h2 id="voice-orb-title" className="story-title mt-2 text-3xl md:text-4xl">
          Tell it out loud
        </h2>
        <p className="mt-3 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
          Someone can help you on this phone.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 border-y border-rule py-10 text-center">
        <button
          type="button"
          className="voice-orb"
          data-state={active ? 'active' : 'idle'}
          onClick={state === 'idle' || state === 'error' ? startSession : undefined}
          disabled={state === 'connecting' || state === 'active' || state === 'working'}
          aria-label={state === 'idle' || state === 'error' ? 'Tap to talk' : statusText}
        >
          <span className="sr-only">Tap to talk</span>
        </button>
        <div aria-live="polite">
          <p className="text-2xl font-medium text-ink">{statusText}</p>
          <p className="mt-1 text-base text-ink-faint">
            {state === 'idle' || state === 'error'
              ? 'The interviewer asks one question at a time.'
              : 'Use Interrupt if you need to speak over the interviewer.'}
          </p>
        </div>
      </div>

      {error ? (
        <Alert tone="error">
          <span className="block">{error}</span>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {state === 'active' ? (
          <>
            <Button variant="secondary" size="lg" onClick={interrupt}>
              Interrupt
            </Button>
            <Button variant="primary" size="lg" onClick={stopAndComplete}>
              Stop
            </Button>
          </>
        ) : null}
        {state === 'connecting' || state === 'working' ? (
          <Button variant="secondary" size="lg" onClick={abandon}>
            Stop
          </Button>
        ) : null}
        {fallbackOffered || state === 'idle' ? (
          <Button variant={fallbackOffered ? 'primary' : 'secondary'} size="lg" onClick={onRecordInstead}>
            Record instead
          </Button>
        ) : null}
      </div>
    </section>
  )
}
