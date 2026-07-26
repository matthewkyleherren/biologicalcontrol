'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {apiFetch} from '@/lib/api'
import {Alert, Button} from '@/components/ui'

export const VOICE_CONSENT_COPY =
  'biologicalcontrol.org may store your voice recordings, use a machine to write them down, and let an editor listen before a story appears. You can choose later whether your voice itself is published.'

type Step = 'idle' | 'offer' | 'confirm'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

function safeNextPath(raw: string | null | undefined) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

/**
 * One-time voice consent with a second “are you sure?” confirmation.
 * Revoking only affects future recordings — past consented drafts stay transcribed.
 */
export function VoiceConsentCard({
  voiceConsentAt,
  getAccessToken,
  onChanged,
  autoOffer = false,
  nextPath,
}: {
  voiceConsentAt: string | null
  getAccessToken: () => Promise<string | null>
  onChanged: (next: string | null) => void
  autoOffer?: boolean
  nextPath?: string | null
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(() =>
    autoOffer && !voiceConsentAt ? 'offer' : 'idle'
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (autoOffer && !voiceConsentAt) setStep('offer')
  }, [autoOffer, voiceConsentAt])

  async function saveConsent(agree: boolean) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const data = await apiFetch<{voiceConsentAt: string | null}>('/me/consent', {
        method: 'PATCH',
        getAccessToken,
        body: {voiceConsent: agree},
      })
      onChanged(data.voiceConsentAt)
      setStep('idle')
      if (agree) {
        const next = safeNextPath(nextPath)
        if (next) {
          router.push(next)
          return
        }
        setNotice('Thank you — you can tell a voice story whenever you like.')
      } else {
        setNotice(
          'Consent withdrawn for future recordings. Stories you already sent stay as they are.'
        )
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save consent.')
    } finally {
      setBusy(false)
    }
  }

  const hasConsent = Boolean(voiceConsentAt)

  return (
    <section
      id="voice-consent"
      className="mt-8 border-y border-rule py-6"
      aria-labelledby="voice-consent-title"
    >
      <p className="rail-title">Voice recordings</p>
      <h2 id="voice-consent-title" className="mt-2 text-[1.1875rem] font-bold tracking-[-0.02em] text-ink">
        {hasConsent ? 'You have agreed to voice recording' : 'Before you record a story'}
      </h2>

      {step === 'idle' && hasConsent ? (
        <div className="mt-3 space-y-4">
          <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            Agreed on {formatWhen(voiceConsentAt!)}. We will not ask again each time you record.
            You can withdraw this for future recordings; anything already transcribed stays.
          </p>
          {notice ? <Alert tone="success">{notice}</Alert> : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button variant="ghost" loading={busy} onClick={() => void saveConsent(false)}>
            Withdraw consent for future recordings
          </Button>
        </div>
      ) : null}

      {step === 'idle' && !hasConsent ? (
        <div className="mt-3 space-y-4">
          <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            {VOICE_CONSENT_COPY}
          </p>
          {notice ? <Alert tone="success">{notice}</Alert> : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Button variant="primary" onClick={() => setStep('offer')}>
            Review and agree
          </Button>
        </div>
      ) : null}

      {step === 'offer' ? (
        <div className="mt-3 space-y-4">
          <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            {VOICE_CONSENT_COPY}
          </p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setStep('confirm')}>
              I agree
            </Button>
            {!autoOffer ? (
              <Button variant="ghost" onClick={() => setStep('idle')}>
                Not now
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="mt-3 space-y-4">
          <p className="max-w-[52ch] text-[1.125rem] font-semibold leading-relaxed text-ink">
            Are you sure you agree?
          </p>
          <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            Please confirm: we may store your recordings and use a machine to write them down so
            an editor can prepare your story. You will not be asked again each time you record.
          </p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" loading={busy} onClick={() => void saveConsent(true)}>
              Yes, I agree
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setStep('offer')}>
              Go back
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
