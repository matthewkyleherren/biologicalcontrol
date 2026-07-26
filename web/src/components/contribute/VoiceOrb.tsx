'use client'

import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {apiFetch} from '@/lib/api'
import {isVoiceConsentRequiredError, voiceConsentHref} from '@/lib/consent'
import {Alert, Button} from '@/components/ui'

type VoiceAgentSession = {
  id: string
  status?: 'idle' | 'active' | 'processing' | 'review' | 'abandoned' | 'completed' | string
  stage?: 'greeting' | 'consent' | 'who' | 'when' | 'where' | 'title' | 'story' | 'confirm' | 'done' | string
  languageHint?: 'en' | 'fr' | 'auto'
  draftId?: string | null
  error?: string | null
}

type DeepgramConnection =
  | {
      mode: 'direct_websocket'
      url: string
      temporaryKey: string
      settings: Record<string, unknown>
      authorizationScheme: 'Bearer'
    }
  | {
      mode: 'server_proxy_required'
      reason: string
      settings: Record<string, unknown>
    }

type CreateSessionResponse = {
  session: VoiceAgentSession
  consentRequired?: boolean
  stageHints?: Record<string, string>
  deepgram: DeepgramConnection
}

type GetSessionResponse = {
  session?: VoiceAgentSession
}

type CompleteStoryResponse = {
  session?: VoiceAgentSession
  draftId?: string
}

type VoiceDraftResponse = {
  draft: {
    id: string
  }
}

type SignedUploadResponse = {
  uploadUrl: string
  key: string
  mode?: string
  headers?: Record<string, string>
}

type VoiceAgentEventBody = {
  type: 'stage' | 'meta' | 'user_text' | 'error' | 'heartbeat'
  payload: {
    stage?: VoiceAgentSession['stage']
    meta?: Record<string, unknown>
    text?: string
    error?: string
    consent?: boolean
    agentSummary?: string
  }
}

type FunctionCall = {
  id?: string
  name: string
  arguments?: unknown
}

type BrowserWindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
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

const DIRECT_UPLOAD_BYTE_LIMIT = 8 * 1024 * 1024
const MAX_DURATION_MS = 20 * 60 * 1000
const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function isEndpointUnavailable(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('404') || normalized.includes('503') || normalized.includes('not found')
}

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

function appendAuthorizationQuery(url: string, temporaryKey: string) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}Authorization=${encodeURIComponent(`Bearer ${temporaryKey}`)}`
}

function openWebSocket(url: string, protocols?: string[]) {
  return new Promise<WebSocket>((resolve, reject) => {
    let settled = false
    let ws: WebSocket
    try {
      ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url)
    } catch (err) {
      reject(err)
      return
    }

    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      ws.close()
      reject(new Error('Deepgram voice connection timed out'))
    }, 8000)

    ws.onopen = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      ws.onopen = null
      ws.onerror = null
      ws.onclose = null
      resolve(ws)
    }
    ws.onerror = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      reject(new Error('Deepgram rejected the browser voice connection'))
    }
    ws.onclose = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      reject(new Error('Deepgram closed before the voice connection was ready'))
    }
  })
}

async function connectDeepgramWebSocket(url: string, temporaryKey: string) {
  try {
    return await openWebSocket(url, ['bearer', temporaryKey])
  } catch {
    return openWebSocket(appendAuthorizationQuery(url, temporaryKey))
  }
}

function resampleToPcm16(input: Float32Array, inputSampleRate: number, outputSampleRate: number) {
  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.max(1, Math.floor(input.length / ratio))
  const buffer = new ArrayBuffer(outputLength * 2)
  const view = new DataView(buffer)

  for (let i = 0; i < outputLength; i += 1) {
    const sourceIndex = i * ratio
    const left = Math.floor(sourceIndex)
    const right = Math.min(input.length - 1, left + 1)
    const weight = sourceIndex - left
    const sample = input[left] * (1 - weight) + input[right] * weight
    const clamped = Math.max(-1, Math.min(1, sample))
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }

  return buffer
}

function parseJsonMessage(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

function functionCallFromRecord(record: Record<string, unknown>): FunctionCall | null {
  const nested = asRecord(record.function)
  const name = firstString(record.name, nested?.name)
  if (!name) return null
  return {
    id: firstString(record.id, record.function_call_id, record.call_id),
    name,
    arguments: record.arguments ?? record.args ?? record.parameters ?? nested?.arguments,
  }
}

function extractFunctionCalls(message: Record<string, unknown>) {
  const arrays = [
    message.functions,
    message.functionCalls,
    message.function_calls,
    message.calls,
    message.tool_calls,
  ]

  const calls: FunctionCall[] = []
  for (const value of arrays) {
    if (!Array.isArray(value)) continue
    for (const item of value) {
      const call = asRecord(item) ? functionCallFromRecord(item) : null
      if (call) calls.push(call)
    }
  }

  const direct = functionCallFromRecord(message)
  if (direct) calls.push(direct)

  return calls
}

function parseFunctionArguments(value: unknown) {
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value)) ?? {}
    } catch {
      return {}
    }
  }
  return asRecord(value) ?? {}
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getAudioContextConstructor() {
  return window.AudioContext || (window as BrowserWindowWithWebkitAudio).webkitAudioContext
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
  const router = useRouter()
  const [session, setSession] = useState<VoiceAgentSession | null>(null)
  const [state, setState] = useState<'idle' | 'connecting' | 'active' | 'working' | 'error'>('idle')
  const [error, setError] = useState('')
  const [fallbackOffered, setFallbackOffered] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputAudioContextRef = useRef<AudioContext | null>(null)
  const outputAudioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const outputPlayheadRef = useRef(0)
  const settingsRef = useRef<Record<string, unknown> | null>(null)
  const settingsSentRef = useRef(false)
  const closingRef = useRef(false)
  const finishedRef = useRef(false)
  const sessionRef = useRef<VoiceAgentSession | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaRecorderTypeRef = useRef('audio/webm')
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef(0)
  const storyStartedAtRef = useRef(0)

  const sessionId = session?.id

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    return () => {
      cleanupConnection()
    }
  }, [])

  useEffect(() => {
    if (!sessionId || state === 'idle' || state === 'error') return
    async function tick() {
      try {
        const data = await apiFetch<GetSessionResponse>(`/voice-agent/sessions/${sessionId}`, {
          getAccessToken,
        })
        if (data.session) {
          setSessionState(data.session)
          if (data.session.draftId) onDraftId(data.session.draftId)
          if (data.session.status === 'processing') setState('working')
          if (data.session.status === 'abandoned') {
            setState('idle')
            setSession(null)
            sessionRef.current = null
          }
        }
      } catch {
        // Polling errors are surfaced by explicit actions; keep the current screen stable.
      }
    }
    const interval = window.setInterval(() => void tick(), 5000)
    return () => window.clearInterval(interval)
  }, [getAccessToken, onDraftId, sessionId, state])

  function setSessionState(nextSession: VoiceAgentSession) {
    sessionRef.current = nextSession
    setSession(nextSession)
  }

  function sendSettings() {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || settingsSentRef.current || !settingsRef.current) {
      return
    }
    ws.send(JSON.stringify(settingsRef.current))
    settingsSentRef.current = true
  }

  function cleanupConnection(stopRecorder = true) {
    closingRef.current = true
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close()
    }
    wsRef.current = null

    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    processorRef.current = null
    sourceRef.current = null

    void inputAudioContextRef.current?.close().catch(() => undefined)
    inputAudioContextRef.current = null

    void outputAudioContextRef.current?.close().catch(() => undefined)
    outputAudioContextRef.current = null
    outputPlayheadRef.current = 0

    if (stopRecorder && mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    if (stopRecorder) {
      mediaRecorderRef.current = null
      recordedChunksRef.current = []
    }

    stopStream(streamRef.current)
    streamRef.current = null
    settingsSentRef.current = false
    settingsRef.current = null
  }

  async function postEvent(id: string, body: VoiceAgentEventBody) {
    const data = await apiFetch<{session?: VoiceAgentSession}>(`/voice-agent/sessions/${id}/events`, {
      method: 'POST',
      getAccessToken,
      body,
    })
    if (data.session) setSessionState(data.session)
    return data
  }

  function startMediaRecorder(stream: MediaStream) {
    if (typeof MediaRecorder === 'undefined') return
    const mimeType = pickMimeType()
    const recorder = mimeType ? new MediaRecorder(stream, {mimeType}) : new MediaRecorder(stream)
    mediaRecorderTypeRef.current = contentTypeForUpload(new Blob([], {type: recorder.mimeType || mimeType}))
    recordedChunksRef.current = []
    recordingStartedAtRef.current = Date.now()
    storyStartedAtRef.current = 0
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data)
    }
    recorder.start(1000)
    mediaRecorderRef.current = recorder
  }

  function markStoryStarted() {
    // Keep audio already captured — clearing here raced with finish_story and
    // produced empty blobs. Prefer a slightly longer archive over losing the story.
    if (!storyStartedAtRef.current) {
      storyStartedAtRef.current = Date.now()
    }
  }

  async function stopMediaRecorder() {
    const recorder = mediaRecorderRef.current
    if (!recorder) return null

    if (recorder.state === 'inactive') {
      return new Blob(recordedChunksRef.current, {type: mediaRecorderTypeRef.current})
    }

    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(recordedChunksRef.current, {type: mediaRecorderTypeRef.current}))
      }
      try {
        recorder.requestData()
      } catch {
        // Some browsers throw when requestData races with stop; onstop still resolves.
      }
      recorder.stop()
    })
  }

  async function startAudioStreaming(stream: MediaStream) {
    const AudioContextCtor = getAudioContextConstructor()
    if (!AudioContextCtor) throw new Error('This browser cannot process live audio here.')
    const audioContext = new AudioContextCtor()
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)

    processor.onaudioprocess = (event) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !settingsSentRef.current) return
      const input = event.inputBuffer.getChannelData(0)
      ws.send(resampleToPcm16(input, audioContext.sampleRate, INPUT_SAMPLE_RATE))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
    inputAudioContextRef.current = audioContext
    sourceRef.current = source
    processorRef.current = processor
  }

  async function playAgentAudio(data: Blob | ArrayBuffer) {
    const arrayBuffer = data instanceof Blob ? await data.arrayBuffer() : data
    if (!arrayBuffer.byteLength) return

    const AudioContextCtor = getAudioContextConstructor()
    if (!AudioContextCtor) return
    const context = outputAudioContextRef.current ?? new AudioContextCtor()
    outputAudioContextRef.current = context
    await context.resume().catch(() => undefined)

    const sampleCount = Math.floor(arrayBuffer.byteLength / 2)
    const audioBuffer = context.createBuffer(1, sampleCount, OUTPUT_SAMPLE_RATE)
    const channel = audioBuffer.getChannelData(0)
    const view = new DataView(arrayBuffer)
    for (let i = 0; i < sampleCount; i += 1) {
      channel[i] = view.getInt16(i * 2, true) / 0x8000
    }

    const source = context.createBufferSource()
    source.buffer = audioBuffer
    source.connect(context.destination)
    const startAt = Math.max(context.currentTime, outputPlayheadRef.current)
    source.start(startAt)
    outputPlayheadRef.current = startAt + audioBuffer.duration
  }

  function clearAgentPlayback() {
    void outputAudioContextRef.current?.close().catch(() => undefined)
    outputAudioContextRef.current = null
    outputPlayheadRef.current = 0
  }

  function sendFunctionResponse(call: FunctionCall, response: Record<string, unknown>) {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const message: Record<string, unknown> = {
      type: 'FunctionCallResponse',
      name: call.name,
      content: JSON.stringify(response),
    }
    if (call.id) {
      message.id = call.id
      message.function_call_id = call.id
    }
    ws.send(JSON.stringify(message))
  }

  async function handleFunctionCall(call: FunctionCall) {
    const id = sessionRef.current?.id
    if (!id) return false
    const args = parseFunctionArguments(call.arguments)

    if (call.name === 'save_people') {
      await postEvent(id, {
        type: 'meta',
        payload: {
          stage: 'when',
          meta: {
            peopleNames: stringArray(args.peopleNames) ?? [],
            peopleSanityIds: stringArray(args.peopleSanityIds) ?? [],
          },
        },
      })
      return false
    }

    if (call.name === 'save_when') {
      await postEvent(id, {
        type: 'meta',
        payload: {
          stage: 'where',
          meta: {
            year: numberValue(args.year),
            yearText: typeof args.yearText === 'string' ? args.yearText : undefined,
          },
        },
      })
      return false
    }

    if (call.name === 'save_where') {
      await postEvent(id, {
        type: 'meta',
        payload: {
          stage: 'title',
          meta: {location: typeof args.location === 'string' ? args.location : undefined},
        },
      })
      return false
    }

    if (call.name === 'save_title') {
      await postEvent(id, {
        type: 'meta',
        payload: {
          stage: 'story',
          meta: {title: typeof args.title === 'string' ? args.title : undefined},
        },
      })
      return false
    }

    if (call.name === 'begin_story') {
      markStoryStarted()
      await postEvent(id, {type: 'stage', payload: {stage: 'story'}})
      return false
    }

    if (call.name === 'finish_story') {
      await postEvent(id, {
        type: 'meta',
        payload: {
          stage: 'done',
          agentSummary: typeof args.agentSummary === 'string' ? args.agentSummary : undefined,
        },
      })
      return true
    }

    return false
  }

  async function handleDeepgramJson(message: Record<string, unknown>) {
    const type = typeof message.type === 'string' ? message.type : ''
    if (type === 'Welcome' || type === 'SettingsApplied' || type === 'ConversationStarted') {
      sendSettings()
      setState('active')
    }

    const calls = extractFunctionCalls(message)
    for (const call of calls) {
      const shouldFinish = await handleFunctionCall(call)
      sendFunctionResponse(call, {ok: true})
      if (shouldFinish) void finishFromRecording()
    }
  }

  async function createDirectDraft(
    blob: Blob,
    durationMs: number,
    contentType: string,
    activeSessionId: string | null,
    languageHint: VoiceAgentSession['languageHint']
  ) {
    if (blob.size > DIRECT_UPLOAD_BYTE_LIMIT) {
      throw new Error(
        'This recording is too long to send in one go. Please make a shorter recording for now, or record instead.'
      )
    }

    const data = await apiFetch<VoiceDraftResponse>('/voice-drafts/direct', {
      method: 'POST',
      getAccessToken,
      body: {
        audioBase64: await blobToBase64(blob),
        contentType,
        audioDurationMs: Math.min(durationMs, MAX_DURATION_MS),
        languageHint: languageHint ?? 'auto',
        voiceConsent: true,
      },
    })

    if (activeSessionId) {
      try {
        const completed = await apiFetch<CompleteStoryResponse>(
          `/voice-agent/sessions/${activeSessionId}/complete-story`,
          {
            method: 'POST',
            getAccessToken,
            body: {draftId: data.draft.id},
          }
        )
        if (completed.session) setSessionState(completed.session)
      } catch {
        // Draft already exists for review — linking the session is best-effort.
      }
    }

    return data.draft.id
  }

  async function uploadOrCreateDraft(
    blob: Blob,
    durationMs: number,
    activeSessionId: string,
    languageHint: VoiceAgentSession['languageHint']
  ) {
    if (!blob.size) throw new Error('The live interviewer did not record enough audio to review.')

    const contentType = contentTypeForUpload(blob)
    // Prefer Deepgram-direct. Production GCS browser PUTs often fail with Safari
    // "Load failed" (CORS), which was ending interviews after a good conversation.
    if (blob.size <= DIRECT_UPLOAD_BYTE_LIMIT) {
      return createDirectDraft(blob, durationMs, contentType, activeSessionId, languageHint)
    }

    try {
      const signed = await apiFetch<SignedUploadResponse>('/uploads/signed-url', {
        method: 'POST',
        getAccessToken,
        body: {
          kind: 'voice',
          contentType,
          extension: extensionForContentType(contentType),
        },
      })

      if (signed.mode === 'stub' || isStubUploadUrl(signed.uploadUrl)) {
        return createDirectDraft(blob, durationMs, contentType, activeSessionId, languageHint)
      }

      const upload = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: signed.headers ?? {'Content-Type': contentType},
        body: blob,
      })
      if (!upload.ok) {
        return createDirectDraft(blob, durationMs, contentType, activeSessionId, languageHint)
      }

      const completed = await apiFetch<CompleteStoryResponse>(
        `/voice-agent/sessions/${activeSessionId}/complete-story`,
        {
          method: 'POST',
          getAccessToken,
          body: {
            audioR2Key: signed.key,
            audioDurationMs: Math.min(durationMs, MAX_DURATION_MS),
          },
        }
      )
      if (completed.session) setSessionState(completed.session)
      if (!completed.draftId) {
        return createDirectDraft(blob, durationMs, contentType, activeSessionId, languageHint)
      }
      return completed.draftId
    } catch {
      return createDirectDraft(blob, durationMs, contentType, activeSessionId, languageHint)
    }
  }

  async function finishFromRecording() {
    if (finishedRef.current) return
    finishedRef.current = true
    setState('working')
    setError('')
    closingRef.current = true

    const activeSessionId = sessionRef.current?.id ?? null
    const languageHint = sessionRef.current?.languageHint ?? 'auto'
    wsRef.current?.close()

    try {
      const blob = await stopMediaRecorder()
      const startedAt = storyStartedAtRef.current || recordingStartedAtRef.current
      const durationMs = startedAt ? Math.max(1, Date.now() - startedAt) : 1
      cleanupConnection(false)
      if (!blob?.size) {
        throw new Error('The live interviewer could not save the recording. Record instead for now.')
      }
      if (!activeSessionId) {
        // Still try to create a reviewable draft even if the session row is gone.
        const draftId = await createDirectDraft(
          blob,
          durationMs,
          contentTypeForUpload(blob),
          null,
          languageHint
        )
        onDraftId(draftId)
        return
      }
      const draftId = await uploadOrCreateDraft(blob, durationMs, activeSessionId, languageHint)
      onDraftId(draftId)
    } catch (err) {
      setState('error')
      setFallbackOffered(true)
      const message = errorMessage(
        err,
        'The live interviewer could not write this down. Record the story instead.'
      )
      setError(
        /load failed|failed to fetch|networkerror/i.test(message)
          ? 'Saving the story failed on the network. Tap Record instead, or try Tell it out loud again.'
          : message
      )
    }
  }

  async function startSession() {
    setError('')
    setFallbackOffered(false)
    finishedRef.current = false
    closingRef.current = false

    if (!consent) {
      setState('error')
      setError('Agree to voice recording on your profile first, then come back to tell a story.')
      return
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof WebSocket === 'undefined' ||
      !getAudioContextConstructor()
    ) {
      setState('error')
      setFallbackOffered(true)
      setError('This browser cannot run the live interviewer here. Record the story instead, or write it.')
      return
    }

    setState('connecting')
    try {
      const data = await apiFetch<CreateSessionResponse>('/voice-agent/sessions', {
        method: 'POST',
        getAccessToken,
        // English Flux is more accurate; French speakers can still be understood,
        // and we can widen to `auto`/`fr` later from profile locale.
        body: {languageHint: 'en'},
      })
      setSessionState(data.session)

      if (data.deepgram.mode === 'server_proxy_required') {
        setState('error')
        setFallbackOffered(true)
        setError(`The live interviewer is not available yet. ${data.deepgram.reason}. Record instead for now.`)
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      streamRef.current = stream
      startMediaRecorder(stream)

      settingsRef.current = data.deepgram.settings
      const ws = await connectDeepgramWebSocket(data.deepgram.url, data.deepgram.temporaryKey)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws
      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          const message = parseJsonMessage(event.data)
          if (message) void handleDeepgramJson(message)
          return
        }
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          void playAgentAudio(event.data)
        }
      }
      ws.onclose = () => {
        if (!closingRef.current && state !== 'working') {
          setState('error')
          setFallbackOffered(true)
          setError('The live interviewer disconnected. Record the story instead, or try again.')
        }
      }
      ws.onerror = () => {
        if (!closingRef.current) {
          setState('error')
          setFallbackOffered(true)
          setError('The live interviewer connection failed. Record the story instead, or try again.')
        }
      }

      await startAudioStreaming(stream)
      sendSettings()
      setState('active')
      await postEvent(data.session.id, {type: 'heartbeat', payload: {consent: true}})
    } catch (err) {
      cleanupConnection()
      if (isVoiceConsentRequiredError(err)) {
        router.replace(voiceConsentHref('/contribute'))
        return
      }
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

  async function interrupt() {
    if (!sessionId) return
    setError('')
    try {
      clearAgentPlayback()
      const data = await postEvent(sessionId, {type: 'user_text', payload: {text: 'Interrupt'}})
      if (data.session) setSessionState(data.session)
    } catch (err) {
      setError(errorMessage(err, 'The interviewer did not receive that. You can stop or record instead.'))
      setState('error')
      setFallbackOffered(true)
    }
  }

  async function stopAndComplete() {
    if (!sessionId) return
    void finishFromRecording()
  }

  async function abandon() {
    if (!sessionId) {
      cleanupConnection()
      setState('idle')
      setError('')
      return
    }
    cleanupConnection()
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
      sessionRef.current = null
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
