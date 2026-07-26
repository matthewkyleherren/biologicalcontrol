import {voiceKeyterms} from './voice-keyterms'

export type DeepgramTranscription = {
  transcript: string
  detectedLanguage?: string
}

type DeepgramResponse = {
  results?: {
    channels?: Array<{
      detected_language?: string
      alternatives?: Array<{
        transcript?: string
      }>
    }>
  }
}

function languageParams(languageHint: string | undefined): Record<string, string> {
  if (languageHint === 'en' || languageHint === 'fr') {
    return {language: languageHint}
  }
  return {detect_language: 'true'}
}

function parseDeepgramResponse(data: DeepgramResponse): DeepgramTranscription {
  const channel = data.results?.channels?.[0]
  const transcript = channel?.alternatives?.[0]?.transcript?.trim() ?? ''
  return {
    transcript,
    detectedLanguage: channel?.detected_language,
  }
}

export async function transcribeAudioFromUrl(
  apiKey: string,
  audioUrlOrBytes: string | ArrayBuffer,
  languageHint: string = 'auto',
  contentType = 'application/octet-stream'
): Promise<DeepgramTranscription> {
  const params = new URLSearchParams()
  params.set('model', 'nova-3')
  params.set('smart_format', 'true')
  params.set('punctuate', 'true')
  params.set('paragraphs', 'true')
  for (const [key, value] of Object.entries(languageParams(languageHint))) {
    params.set(key, value)
  }
  // Boost programme vocabulary (Nova keyterm param; repeat per term).
  for (const term of voiceKeyterms()) {
    params.append('keyterm', term)
  }
  const url = `https://api.deepgram.com/v1/listen?${params.toString()}`

  const isUrl = typeof audioUrlOrBytes === 'string'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': isUrl ? 'application/json' : contentType,
    },
    body: isUrl ? JSON.stringify({url: audioUrlOrBytes}) : audioUrlOrBytes,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Deepgram transcription failed (${res.status}): ${text.slice(0, 500)}`)
  }

  const data = (await res.json()) as DeepgramResponse
  return parseDeepgramResponse(data)
}
