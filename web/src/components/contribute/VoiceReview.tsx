'use client'

import {useMemo, useState} from 'react'
import {apiFetch} from '@/lib/api'
import {Alert, Button, TextAreaField, TextField} from '@/components/ui'
import {isValidYear} from '@/components/forms/validation'

export type VoiceDraft = {
  id: string
  status?: 'recording' | 'processing' | 'review' | 'submitted' | 'published' | 'rejected' | string
  transcriptStatus?: 'pending' | 'processing' | 'ready' | 'failed' | string
  transcriptRaw?: string | null
  transcriptEdited?: string | null
  title?: string | null
  year?: number | null
  yearText?: string | null
  location?: string | null
  sanityPersonIds?: string[] | null
  peopleNames?: string[] | null
  publishAudio?: boolean | null
}

type Values = {
  title: string
  year: string
  location: string
  transcriptEdited: string
  publishAudio: boolean
}

function valuesFromDraft(draft: VoiceDraft): Values {
  return {
    title: draft.title || '',
    year: draft.year ? String(draft.year) : draft.yearText || '',
    location: draft.location || '',
    transcriptEdited: draft.transcriptEdited || draft.transcriptRaw || '',
    publishAudio: Boolean(draft.publishAudio),
  }
}

function yearPayload(value: string): {year?: number; yearText?: string} {
  const trimmed = value.trim()
  if (!trimmed) return {}
  if (/^\d{4}$/.test(trimmed) && isValidYear(trimmed)) return {year: Number(trimmed)}
  return {yearText: trimmed}
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export function VoiceReview({
  draft,
  getAccessToken,
  onSubmitted,
  onRetell,
}: {
  draft: VoiceDraft
  getAccessToken: () => Promise<string | null>
  onSubmitted: (draft: VoiceDraft) => void
  onRetell: () => void
}) {
  const [values, setValues] = useState<Values>(() => valuesFromDraft(draft))
  const [editing, setEditing] = useState(() => !draft.title || !(draft.transcriptEdited || draft.transcriptRaw))
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const errors = useMemo(() => {
    const next: Partial<Record<keyof Values, string>> = {}
    if (!values.title.trim()) next.title = 'Add a title before sending this to the editors.'
    if (!values.transcriptEdited.trim()) next.transcriptEdited = 'Add the story text before sending.'
    if (values.year.trim() && /^\d{4}$/.test(values.year.trim()) && !isValidYear(values.year.trim())) {
      next.year = 'Use a year between 1975 and 2030, or write it approximately.'
    }
    if (values.year.trim().length > 120) next.year = 'Keep the year note under 120 characters.'
    return next
  }, [values])

  const canSubmit = Object.keys(errors).length === 0
  const people = draft.peopleNames?.filter(Boolean) ?? []

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({...prev, [key]: value}))
  }

  async function submit() {
    if (!canSubmit) {
      setEditing(true)
      return
    }

    setStatus('submitting')
    setMessage('')
    try {
      const payload = {
        title: values.title.trim(),
        transcriptEdited: values.transcriptEdited.trim(),
        sanityPersonIds: draft.sanityPersonIds ?? [],
        publishAudio: values.publishAudio,
        location: values.location.trim() || undefined,
        ...yearPayload(values.year),
      }
      const data = await apiFetch<{draft: VoiceDraft}>(`/voice-drafts/${draft.id}/submit`, {
        method: 'POST',
        getAccessToken,
        body: payload,
      })
      onSubmitted(data.draft)
    } catch (err) {
      setStatus('error')
      setMessage(
        errorMessage(err, 'The story could not be sent just now. Check your connection and try again.')
      )
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="voice-review-title">
      <div>
        <p className="rail-title">Review</p>
        <h2 id="voice-review-title" className="story-title mt-2 text-3xl md:text-4xl">
          Does this sound like you?
        </h2>
      </div>

      {editing ? (
        <div className="space-y-5 border-y border-rule py-5">
          <TextField
            label="Title"
            name="voice-title"
            value={values.title}
            onChange={(event) => update('title', event.target.value)}
            error={errors.title ?? null}
            required
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="About year"
              name="voice-year"
              optional
              help='A year, or words like "late eighties".'
              value={values.year}
              onChange={(event) => update('year', event.target.value)}
              error={errors.year ?? null}
            />
            <TextField
              label="Where"
              name="voice-location"
              optional
              help="Compound, station, field site, town, or home."
              value={values.location}
              onChange={(event) => update('location', event.target.value)}
            />
          </div>
          <TextAreaField
            label="The story"
            name="voice-transcript"
            rows={14}
            value={values.transcriptEdited}
            onChange={(event) => update('transcriptEdited', event.target.value)}
            error={errors.transcriptEdited ?? null}
            required
          />
        </div>
      ) : (
        <div className="border-y border-rule py-5">
          <h3 className="story-title text-2xl md:text-3xl">{values.title || 'Untitled story'}</h3>
          <dl className="mt-4 grid gap-3 text-lg sm:grid-cols-2">
            <div>
              <dt className="rail-title">About year</dt>
              <dd className="mt-1 text-ink-soft">{values.year || 'Not sure'}</dd>
            </div>
            <div>
              <dt className="rail-title">Where</dt>
              <dd className="mt-1 text-ink-soft">{values.location || 'Not named'}</dd>
            </div>
          </dl>
          {people.length > 0 ? (
            <div className="mt-4">
              <p className="rail-title">People mentioned</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {people.map((name) => (
                  <span key={name} className="chip">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="prose-story-plain mt-6 max-w-none whitespace-pre-wrap text-lg leading-relaxed">
            {values.transcriptEdited || 'No transcript text yet.'}
          </div>
        </div>
      )}

      <label className="flex min-h-14 cursor-pointer items-start gap-3 border border-rule bg-surface p-4 text-base leading-relaxed text-ink">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-accent"
          checked={values.publishAudio}
          onChange={(event) => update('publishAudio', event.target.checked)}
        />
        <span>Also publish my voice with the story. If this is off, editors can still review the recording.</span>
      </label>

      {status === 'error' ? <Alert tone="error">{message}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="lg" loading={status === 'submitting'} onClick={submit}>
          Looks good — send to editors
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setEditing((prev) => !prev)}>
          {editing ? 'Preview' : 'Edit the text'}
        </Button>
        <Button variant="ghost" size="lg" onClick={onRetell}>
          Retell
        </Button>
      </div>
    </section>
  )
}
