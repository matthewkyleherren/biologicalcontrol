import type {ApiEnv} from '../env'

export type ClarityEditInput = {
  transcript: string
  title?: string | null
  year?: number | null
  yearText?: string | null
  location?: string | null
  peopleNames?: string[] | null
}

export type ClarityEditResult = {
  edited: string
  titleSuggestion?: string
}

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const SYSTEM_PROMPT = [
  'You lightly edit oral-history transcripts for biologicalcontrol.org.',
  'Preserve the teller’s meaning, voice, language, and sequence of events.',
  'You may fix punctuation, paragraph breaks, repeated filler, and obvious transcription noise.',
  'Do not invent facts, names, dates, locations, dialogue, motivations, programme history, or conclusions.',
  'If a passage is unclear, keep it close to the transcript instead of guessing.',
  'Return only JSON with keys "edited" and optional "titleSuggestion".',
].join('\n')

function parseModelJson(content: string, fallbackTranscript: string): ClarityEditResult {
  try {
    const parsed = JSON.parse(content) as {
      edited?: unknown
      titleSuggestion?: unknown
    }
    const edited =
      typeof parsed.edited === 'string' && parsed.edited.trim()
        ? parsed.edited.trim()
        : fallbackTranscript
    const titleSuggestion =
      typeof parsed.titleSuggestion === 'string' && parsed.titleSuggestion.trim()
        ? parsed.titleSuggestion.trim().slice(0, 200)
        : undefined
    return {edited, titleSuggestion}
  } catch {
    return {edited: content.trim() || fallbackTranscript}
  }
}

function buildUserPrompt(input: ClarityEditInput) {
  const meta = {
    title: input.title ?? null,
    year: input.year ?? null,
    yearText: input.yearText ?? null,
    location: input.location ?? null,
    peopleNames: input.peopleNames ?? [],
  }

  return [
    'Known metadata (do not add to the story unless already present in the transcript):',
    JSON.stringify(meta),
    '',
    'Transcript:',
    input.transcript,
  ].join('\n')
}

async function callChatCompletions(options: {
  url: string
  apiKey: string
  model: string
  input: ClarityEditInput
}) {
  const res = await fetch(options.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.2,
      response_format: {type: 'json_object'},
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: buildUserPrompt(options.input)},
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Clarity edit failed (${res.status}): ${text.slice(0, 500)}`)
  }

  const data = (await res.json()) as ChatResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Clarity edit response was empty')
  }
  return parseModelJson(content, options.input.transcript)
}

export async function clarityEditTranscript(
  env: ApiEnv,
  input: ClarityEditInput
): Promise<ClarityEditResult | null> {
  if (env.OPENROUTER_API_KEY) {
    return callChatCompletions({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini',
      input,
    })
  }

  if (env.OPENAI_API_KEY) {
    return callChatCompletions({
      url: 'https://api.openai.com/v1/chat/completions',
      apiKey: env.OPENAI_API_KEY,
      model: 'gpt-4.1-mini',
      input,
    })
  }

  return null
}
