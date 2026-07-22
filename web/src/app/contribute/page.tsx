'use client'

import {useCallback, useId, useState} from 'react'
import Link from 'next/link'
import {Show, SignInButton, useAuth, useUser} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import {Alert, Button, ButtonLink, EmptyState, PageHeader, TextAreaField, TextField} from '@/components/ui'
import {isBlank, isValidYear} from '@/components/forms/validation'

type Values = {
  title: string
  year: string
  location: string
  body: string
}

const EMPTY_VALUES: Values = {title: '', year: '', location: '', body: ''}

const MIN_BODY_LENGTH = 40

type Touched = Partial<Record<keyof Values, boolean>>

function errorsFor(values: Values): Partial<Record<'title' | 'body' | 'year', string>> {
  const errors: Partial<Record<'title' | 'body' | 'year', string>> = {}
  if (isBlank(values.title)) {
    errors.title = 'Add a title so this story can be found later.'
  }
  if (isBlank(values.body)) {
    errors.body = 'Write the story — a few sentences at least.'
  } else if (values.body.trim().length < MIN_BODY_LENGTH) {
    errors.body = 'A little more detail will help — names, places, or what happened next.'
  }
  if (!isValidYear(values.year)) {
    errors.year = 'Enter a four-digit year between 1975 and 2030, or leave this blank.'
  }
  return errors
}

export default function ContributePage() {
  const {getToken} = useAuth()
  const {user} = useUser()
  const tokenFn = useCallback(() => getToken(), [getToken])

  const [values, setValues] = useState<Values>(EMPTY_VALUES)
  const [touched, setTouched] = useState<Touched>({})
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [resultMessage, setResultMessage] = useState('')
  const statusId = useId()

  const errors = errorsFor(values)
  const isValid = Object.keys(errors).length === 0

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({...prev, [key]: value}))
  }

  function blur(key: keyof Values) {
    setTouched((prev) => ({...prev, [key]: true}))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTouched({title: true, body: true, year: true})
    if (!isValid) return

    setStatus('loading')
    try {
      const data = await apiFetch<{message?: string; queued?: boolean}>('/stories/drafts', {
        method: 'POST',
        getAccessToken: tokenFn,
        body: {
          title: values.title.trim(),
          body: values.body.trim(),
          year: values.year.trim() ? Number(values.year) : undefined,
          location: values.location.trim() || undefined,
        },
      })
      setStatus('ok')
      setResultMessage(data.message || 'Received — thank you.')
    } catch (err) {
      setStatus('error')
      setResultMessage(
        err instanceof Error && err.message
          ? err.message
          : 'The story could not be sent just now. Check your connection and try again.'
      )
    }
  }

  function startOver() {
    setValues(EMPTY_VALUES)
    setTouched({})
    setStatus('idle')
    setResultMessage('')
  }

  if (status === 'ok') {
    return (
      <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
        <PageHeader title="Share a story from the compound" />
        <div className="mt-6" aria-live="polite">
          <Alert tone="success">{resultMessage}</Alert>
        </div>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
          An editor reads every story before it appears on the site — that usually takes a few
          days.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/stories" variant="primary">
            Read other stories
          </ButtonLink>
          <Button variant="secondary" onClick={startOver}>
            Write another story
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <PageHeader
        title="Share a story from the compound"
        subtitle="Families welcome — staff, spouses, kids who grew up on station, national-programme friends. Two paragraphs count."
      />

      <Show when="signed-out">
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
      </Show>

      <Show when="signed-in">
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          <p className="text-base text-ink-soft">
            Sending as {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'you'}.{' '}
            <Link href="/me" className="underline decoration-rule hover:text-accent">
              Edit profile
            </Link>
          </p>

          <TextField
            label="Title"
            name="title"
            required
            aria-required="true"
            help="Short and specific — e.g., ‘The night the generator failed.’"
            value={values.title}
            onChange={(e) => update('title', e.target.value)}
            onBlur={() => blur('title')}
            error={touched.title ? errors.title : null}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="About what year?"
              name="year"
              type="number"
              inputMode="numeric"
              min={1975}
              max={2030}
              optional
              help="If you remember roughly when."
              value={values.year}
              onChange={(e) => update('year', e.target.value)}
              onBlur={() => blur('year')}
              error={touched.year ? errors.year : null}
            />
            <TextField
              label="Where"
              name="location"
              optional
              help="Compound, station, or town."
              value={values.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>

          <TextAreaField
            label="The telling"
            name="body"
            required
            aria-required="true"
            rows={14}
            help="Be specific. Names, places, years, smells, jokes — folklore lives in detail."
            value={values.body}
            onChange={(e) => update('body', e.target.value)}
            onBlur={() => blur('body')}
            error={touched.body ? errors.body : null}
          />

          {status === 'error' ? (
            <div aria-live="polite" id={statusId}>
              <Alert tone="error">{resultMessage}</Alert>
            </div>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={status === 'loading'}
            disabled={!isValid}
            aria-describedby={status === 'error' ? statusId : undefined}
          >
            {status === 'loading' ? 'Sending…' : 'Send my story'}
          </Button>
        </form>
      </Show>
    </main>
  )
}
