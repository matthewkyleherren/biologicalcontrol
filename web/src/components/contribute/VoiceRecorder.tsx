'use client'

import {useEffect, useRef, useState} from 'react'
import {apiFetch} from '@/lib/api'
import {Alert, Button, Icon} from '@/components/ui'
import type {VoiceDraft} from './VoiceReview'

type RecorderState = 'idle' | 'recording' | 'uploading' | 'processing'

type SignedUploadResponse = {
  uploadUrl: string
  key: string
  mode?: string
  headers?: Record<string, string>
}

const MAX_DURATION_MS = 20 * 60 * 1000
const WARNING_DURATION_MS = 15 * 60 * 1000
const MAX_DIRECT_FALLBACK_BYTES = 8 * 1024 * 1024

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

function contentTypeForUpload(blob: Blob) {
  return (blob.type || 'audio/webm').split(';')[0] || 'audio/webm'
}

function extensionForContentType(contentType: string) {
  if (contentType.includes('mp4')) return 'm4a'
  if (contentType.includes('mpeg')) return 'mp3'
  if (contentType.includes('wav')) return 'wav'
  return 'webm'
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function isStubUploadUrl(uploadUrl: string) {
  try {
    return new URL(uploadUrl).hostname === 'upload.stub.local'
  } catch {
    return uploadUrl.includes('upload.stub.local')
  }
}

async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return window.btoa(binary)
}

export function VoiceRecorder({
  consent,
  getAccessToken,
  onDraftCreated,
}: {
  consent: boolean
  getAccessToken: () => Promise<string | null>
  onDraftCreated: (draft: VoiceDraft) => void
}) {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState('')
  const [autoStopped, setAutoStopped] = useState(false)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const elapsedMsRef = useRef<number>(0)
  const finalizedRef = useRef(false)

  useEffect(() => {
    if (state !== 'recording') return
    const interval = window.setInterval(() => {
      const nextElapsed = performance.now() - startedAtRef.current
      elapsedMsRef.current = nextElapsed
      setElapsedMs(nextElapsed)
      if (nextElapsed >= MAX_DURATION_MS) {
        setAutoStopped(true)
        const recorder = recorderRef.current
        if (recorder && recorder.state !== 'inactive') recorder.stop()
      }
    }, 500)
    return () => window.clearInterval(interval)
  }, [state])

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      stopStream(streamRef.current)
    }
  }, [])

  async function startRecording(event: React.MouseEvent<HTMLButtonElement>) {
    setError('')
    setAutoStopped(false)

    if (!consent) {
      setError('Check the consent box first, then tap to record.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio here. Try a recent Chrome or Safari, or write instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, {mimeType}) : new MediaRecorder(stream)

      chunksRef.current = []
      finalizedRef.current = false
      streamRef.current = stream
      recorderRef.current = recorder
      startedAtRef.current = event.timeStamp
      elapsedMsRef.current = 0
      setElapsedMs(0)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        if (finalizedRef.current) return
        finalizedRef.current = true
        const durationMs = Math.max(1, elapsedMsRef.current)
        const recordedType = contentTypeForUpload(new Blob([], {type: recorder.mimeType || mimeType}))
        const blob = new Blob(chunksRef.current, {type: recordedType})
        stopStream(streamRef.current)
        streamRef.current = null
        void uploadAndCreateDraft(blob, durationMs)
      }

      recorder.start(1000)
      setState('recording')
    } catch (err) {
      stopStream(streamRef.current)
      streamRef.current = null
      setState('idle')
      setError(
        errorMessage(
          err,
          'The microphone could not be opened. Check browser settings, allow the microphone, then try again.'
        )
      )
    }
  }

  function stopRecording(timeStamp?: number) {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return
    if (typeof timeStamp === 'number') {
      elapsedMsRef.current = Math.max(elapsedMsRef.current, timeStamp - startedAtRef.current)
    }
    recorder.stop()
  }

  async function uploadAndCreateDraft(blob: Blob, durationMs: number) {
    if (!blob.size) {
      setState('idle')
      setError('Nothing was recorded. Tap to record and speak after the timer starts.')
      return
    }

    setState('uploading')
    setError('')
    try {
      const contentType = contentTypeForUpload(blob)
      const createDirectDraft = async () => {
        if (blob.size > MAX_DIRECT_FALLBACK_BYTES) {
          throw new Error(
            'This recording is too long to save without storage configured. Please make a shorter recording for now, or write it down.'
          )
        }
        setState('processing')
        const data = await apiFetch<{draft: VoiceDraft}>('/voice-drafts/direct', {
          method: 'POST',
          getAccessToken,
          body: {
            audioBase64: await blobToBase64(blob),
            contentType,
            audioDurationMs: Math.min(durationMs, MAX_DURATION_MS),
            languageHint: 'auto',
            voiceConsent: true,
          },
        })
        onDraftCreated(data.draft)
      }

      const signed = await apiFetch<SignedUploadResponse>('/uploads/signed-url', {
        method: 'POST',
        getAccessToken,
        body: {
          kind: 'voice',
          contentType,
          extension: extensionForContentType(contentType),
        },
      })

      if (signed.mode === 'stub') {
        await createDirectDraft()
        return
      }

      let upload: Response
      try {
        upload = await fetch(signed.uploadUrl, {
          method: 'PUT',
          headers: signed.headers ?? {'Content-Type': contentType},
          body: blob,
        })
      } catch (err) {
        if (isStubUploadUrl(signed.uploadUrl)) {
          await createDirectDraft()
          return
        }
        throw err
      }
      if (!upload.ok) {
        throw new Error('The recording could not be uploaded. Check your connection and try again.')
      }

      setState('processing')
      const data = await apiFetch<{draft: VoiceDraft}>('/voice-drafts', {
        method: 'POST',
        getAccessToken,
        body: {
          audioR2Key: signed.key,
          audioDurationMs: Math.min(durationMs, MAX_DURATION_MS),
          languageHint: 'auto',
          voiceConsent: true,
        },
      })
      onDraftCreated(data.draft)
    } catch (err) {
      setState('idle')
      setError(
        errorMessage(
          err,
          'The recording could not be saved. Check your connection and try again, or write instead.'
        )
      )
    }
  }

  const busy = state === 'uploading' || state === 'processing'
  const recording = state === 'recording'

  return (
    <section className="space-y-5" aria-labelledby="voice-record-title">
      <div>
        <p className="rail-title">Record</p>
        <h2 id="voice-record-title" className="story-title mt-2 text-3xl md:text-4xl">
          Tap to record
        </h2>
        <p className="mt-3 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
          Someone can help you on this phone.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 border-y border-rule py-8 text-center">
        <button
          type="button"
          className="flex h-44 w-44 items-center justify-center rounded-lg border border-accent bg-accent text-surface transition-[opacity,transform] duration-[var(--dur-base)] ease-out hover:opacity-90 active:translate-y-px disabled:opacity-45 md:h-56 md:w-56"
          disabled={busy}
          aria-pressed={recording}
          onClick={(event) => {
            if (recording) stopRecording(event.timeStamp)
            else void startRecording(event)
          }}
        >
          <span className="flex flex-col items-center gap-3">
            <Icon name="mic" size={42} />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.08em]">
              {recording ? 'Stop' : busy ? 'Saving' : 'Record'}
            </span>
          </span>
        </button>

        <div aria-live="polite">
          {recording ? (
            <p className="text-2xl font-medium text-ink">{formatDuration(elapsedMs)}</p>
          ) : state === 'uploading' ? (
            <p className="text-xl font-medium text-ink">Uploading the recording…</p>
          ) : state === 'processing' ? (
            <p className="text-xl font-medium text-ink">Writing that down…</p>
          ) : (
            <p className="text-xl font-medium text-ink">Tap to record</p>
          )}
          <p className="mt-1 text-base text-ink-faint">
            {recording && elapsedMs >= WARNING_DURATION_MS
              ? 'You can keep going for a few more minutes, or stop now.'
              : 'Record up to 20 minutes. Stop when the story is finished.'}
          </p>
        </div>
      </div>

      {autoStopped ? (
        <Alert tone="info">The recorder stopped at 20 minutes and is saving what you said.</Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      {recording ? (
        <Button variant="secondary" size="lg" onClick={(event) => stopRecording(event.timeStamp)} block>
          Stop and write it down
        </Button>
      ) : null}
    </section>
  )
}
