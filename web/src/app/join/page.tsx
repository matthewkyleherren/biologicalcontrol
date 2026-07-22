'use client'

import {useId, useState} from 'react'
import Link from 'next/link'
import {Alert, Button, ButtonLink, PageHeader, TextAreaField, TextField} from '@/components/ui'
import {isBlank, isValidEmail} from '@/components/forms/validation'

type Values = {
  name: string
  email: string
  role: string
  yearsActive: string
  location: string
  bio: string
}

const EMPTY_VALUES: Values = {
  name: '',
  email: '',
  role: '',
  yearsActive: '',
  location: '',
  bio: '',
}

type Touched = Partial<Record<keyof Values, boolean>>

function errorsFor(values: Values): Partial<Record<'name' | 'email', string>> {
  const errors: Partial<Record<'name' | 'email', string>> = {}
  if (isBlank(values.name)) {
    errors.name = 'Add your name so people can find you.'
  }
  if (isBlank(values.email)) {
    errors.email = 'Add an email address.'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'That email address doesn’t look complete — check it and try again.'
  }
  return errors
}

export default function JoinPage() {
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
    setTouched({name: true, email: true})
    if (!isValid) return

    setStatus('loading')
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(values),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        error?: string
        queued?: boolean
      }
      if (res.ok) {
        setStatus('ok')
        setResultMessage(
          data.queued
            ? "Your details were received. An editor will add you to the directory by hand — it may take a little longer than usual, but you're on the list."
            : data.message || 'Your profile was created.'
        )
      } else {
        setStatus('error')
        setResultMessage(data.error || 'Your profile could not be saved just now. Try again in a moment.')
      }
    } catch {
      setStatus('error')
      setResultMessage('Your profile could not be sent — check your connection and try again.')
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
        <PageHeader title="Create a profile" />
        <div className="mt-6" aria-live="polite">
          <Alert tone="success">{resultMessage}</Alert>
        </div>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
          You can add a photo, deepen your biography, or claim your listing in the people
          directory any time — find it under your account settings.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/people" variant="primary">
            Find someone you remember
          </ButtonLink>
          <Button variant="secondary" onClick={startOver}>
            Add another profile
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <Link href="/people" className="text-sm text-ink-faint hover:text-accent">
        ← People
      </Link>
      <PageHeader
        title="Create a profile"
        subtitle="A community archive for everyone who was part of the programme. Add a profile so colleagues who worked with you can find you again."
      />

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            required
            aria-required="true"
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => blur('name')}
            error={touched.name ? errors.name : null}
          />
          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            help="Private — used to confirm it’s you, never shown publicly."
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => blur('email')}
            error={touched.email ? errors.email : null}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="How you were connected"
            name="role"
            optional
            help="Entomologist, spouse, kid on station, pilot…"
            value={values.role}
            onChange={(e) => update('role', e.target.value)}
          />
          <TextField
            label="Years around the programme"
            name="yearsActive"
            optional
            help="For example, 1983–1989."
            value={values.yearsActive}
            onChange={(e) => update('yearsActive', e.target.value)}
          />
        </div>
        <TextField
          label="Primary base"
          name="location"
          optional
          help="Ibadan, Cotonou, or wherever you were mostly stationed."
          value={values.location}
          onChange={(e) => update('location', e.target.value)}
        />
        <TextAreaField
          label="Short bio"
          name="bio"
          optional
          rows={6}
          help="A few sentences is plenty — what you remember, who you’re hoping to find."
          value={values.bio}
          onChange={(e) => update('bio', e.target.value)}
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
          {status === 'loading' ? 'Creating profile…' : 'Create my profile'}
        </Button>
      </form>
    </main>
  )
}
