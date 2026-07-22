'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Show, SignInButton, useAuth, useUser} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'

export default function ContributePage() {
  const {getToken} = useAuth()
  const {user} = useUser()
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = new FormData(e.currentTarget)
    try {
      const data = await apiFetch<{message?: string; queued?: boolean}>('/stories/drafts', {
        method: 'POST',
        getAccessToken: () => getToken(),
        body: {
          title: String(form.get('title') || ''),
          body: String(form.get('body') || ''),
          year: form.get('year') ? Number(form.get('year')) : undefined,
          location: String(form.get('location') || '') || undefined,
        },
      })
      setStatus('ok')
      setMessage(data.message || 'Received — thank you.')
      e.currentTarget.reset()
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <p className="rail-title">Join the archive</p>
      <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">
        Share a story from the compound
      </h1>
      <p className="mt-5 text-xl leading-relaxed text-ink-soft">
        Families welcome. Staff, spouses, kids who grew up on station, national-programme friends —
        if you were there, you have a piece of this. Two paragraphs count.
      </p>

      <Show when="signed-out">
        <div className="mt-10 border border-rule bg-paper-2 p-6">
          <p className="text-lg leading-relaxed">
            Sign in first — password or a text code — then send the story under your account.
          </p>
          <SignInButton mode="modal" forceRedirectUrl="/contribute">
            <button type="button" className="btn-primary mt-5">
              Sign in to contribute
            </button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <form onSubmit={onSubmit} className="mt-12 space-y-5 border-t border-rule pt-10">
          <p className="text-base text-ink-soft">
            Sending as {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'you'}.{' '}
            <Link href="/me" className="underline decoration-rule">
              Edit profile
            </Link>
          </p>
          <div>
            <label htmlFor="title" className="rail-title">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="e.g. The night the generator failed"
              className="mt-2 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="year" className="rail-title">
                About what year?
              </label>
              <input
                id="year"
                name="year"
                type="number"
                min={1975}
                max={2030}
                placeholder="1987"
                className="mt-2 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
              />
            </div>
            <div>
              <label htmlFor="location" className="rail-title">
                Where
              </label>
              <input
                id="location"
                name="location"
                placeholder="Cotonou compound, Ibadan…"
                className="mt-2 min-h-12 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
              />
            </div>
          </div>
          <div>
            <label htmlFor="body" className="rail-title">
              The telling
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={10}
              placeholder="Be specific. Names, places, years, smells, jokes. Folklore lives in detail."
              className="mt-2 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg leading-relaxed"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary disabled:opacity-60"
          >
            {status === 'loading' ? 'Sending…' : 'Submit to the archive'}
          </button>
          {status === 'ok' || status === 'error' ? (
            <p className={`text-base ${status === 'ok' ? 'text-accent' : 'text-red-800'}`}>
              {message}
            </p>
          ) : null}
        </form>
      </Show>
    </main>
  )
}
