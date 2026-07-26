'use client'

import {useCallback, useEffect, useState} from 'react'
import {apiFetch} from '@/lib/api'
import {Alert, Button, ButtonLink} from '@/components/ui'
import {VoiceConsent} from './VoiceConsent'
import {VoiceOrb} from './VoiceOrb'
import {VoiceRecorder} from './VoiceRecorder'
import {VoiceReview, type VoiceDraft} from './VoiceReview'

type Flow = 'orb' | 'record' | 'polling' | 'review' | 'submitted'

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function readyForReview(draft: VoiceDraft) {
  return draft.status === 'review' || draft.transcriptStatus === 'ready'
}

export function VoiceContribute({getAccessToken}: {getAccessToken: () => Promise<string | null>}) {
  const [consent, setConsent] = useState(false)
  const [flow, setFlow] = useState<Flow>('orb')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [error, setError] = useState('')

  const pollDraft = useCallback(
    async (id: string) => {
      const data = await apiFetch<{draft: VoiceDraft}>(`/voice-drafts/${id}`, {getAccessToken})
      setDraft(data.draft)
      if (readyForReview(data.draft)) {
        setFlow('review')
      } else if (data.draft.transcriptStatus === 'failed' || data.draft.status === 'rejected') {
        setFlow('record')
        setError('The recording was saved, but it could not be written down. Please record it again or write it.')
      }
    },
    [getAccessToken]
  )

  useEffect(() => {
    if (flow !== 'polling' || !draftId) return

    let cancelled = false
    async function tick() {
      if (!draftId) return
      try {
        await pollDraft(draftId)
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err, 'The draft could not be checked. Keep this page open and try again.'))
        }
      }
    }

    void tick()
    const interval = window.setInterval(() => void tick(), 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [draftId, flow, pollDraft])

  const handleDraftCreated = useCallback((nextDraft: VoiceDraft) => {
    setDraft(nextDraft)
    setDraftId(nextDraft.id)
    setError('')
    setFlow(readyForReview(nextDraft) ? 'review' : 'polling')
  }, [])

  const handleDraftId = useCallback(
    (id: string) => {
      setDraftId(id)
      setError('')
      setFlow('polling')
      // Orb direct-transcribe drafts are often already ready — check immediately.
      void pollDraft(id).catch((err) => {
        setError(errorMessage(err, 'The draft could not be checked. Keep this page open and try again.'))
      })
    },
    [pollDraft]
  )

  function retell() {
    setDraft(null)
    setDraftId(null)
    setError('')
    setFlow('record')
  }

  function startAnother() {
    setDraft(null)
    setDraftId(null)
    setError('')
    setFlow('orb')
  }

  if (flow === 'submitted') {
    return (
      <div className="mt-8 space-y-6">
        <Alert tone="success">
          Received — thank you. It is waiting in Review until someone approves it for the public
          archive.
        </Alert>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/review" variant="primary">
            Open review queue
          </ButtonLink>
          <ButtonLink href="/stories" variant="secondary">
            Read other stories
          </ButtonLink>
          <Button variant="ghost" onClick={startAnother}>
            Tell another story
          </Button>
        </div>
      </div>
    )
  }

  if (flow === 'review' && draft) {
    return (
      <div className="mt-8">
        <VoiceReview
          draft={draft}
          getAccessToken={getAccessToken}
          onSubmitted={(nextDraft) => {
            setDraft(nextDraft)
            setFlow('submitted')
          }}
          onRetell={retell}
        />
      </div>
    )
  }

  if (flow === 'polling') {
    return (
      <div className="mt-8 space-y-5">
        <div className="border-y border-rule py-8" aria-live="polite" aria-busy="true">
          <p className="rail-title">Processing</p>
          <h2 className="story-title mt-2 text-3xl md:text-4xl">Writing that down…</h2>
          <p className="mt-3 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
            Keep this page open. The review will appear here when the transcript is ready.
          </p>
        </div>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button variant="secondary" onClick={() => draftId && void pollDraft(draftId)}>
          Check again
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <VoiceConsent checked={consent} onCheckedChange={setConsent} />

      {error ? <Alert tone="error">{error}</Alert> : null}

      {flow === 'record' ? (
        <div className="space-y-5">
          <VoiceRecorder consent={consent} getAccessToken={getAccessToken} onDraftCreated={handleDraftCreated} />
          <Button variant="ghost" onClick={() => setFlow('orb')}>
            Try the interviewer
          </Button>
        </div>
      ) : (
        <VoiceOrb
          consent={consent}
          getAccessToken={getAccessToken}
          onDraftId={handleDraftId}
          onRecordInstead={() => {
            setError('')
            setFlow('record')
          }}
        />
      )}
    </div>
  )
}
