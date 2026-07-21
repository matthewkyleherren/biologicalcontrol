'use client'

import {useState} from 'react'
import Link from 'next/link'

export default function ContributePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/contribute', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        kind: form.get('kind'),
        name: form.get('name'),
        email: form.get('email'),
        title: form.get('title'),
        body: form.get('body'),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setStatus('ok')
      setMessage(data.message || 'Received — thank you.')
      e.currentTarget.reset()
    } else {
      setStatus('error')
      setMessage(data.error || 'Something went wrong. Try again or email the editors.')
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
        if you were there, you have a piece of this. Two paragraphs count. A dozen photos with
        names on the back count. The archive wants the human texture: the jokes, the near-misses,
        the nights that never made an annual report.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        The kind of story we mean — not a claim about anyone in particular — is the one where
        someone climbs a papaya tree after dinner and only later notices it was hollow. Messy,
        funny, affectionate. Folklore, not a CV.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Tell a story',
            body: 'A specific night, flight, argument, or compound comedy — oral history, not impact metrics.',
          },
          {
            title: 'Name who was there',
            body: 'Colleagues, partners, spouses, kids in the frame. Profiles link stories across decades.',
          },
          {
            title: 'Upload photos',
            body: 'Insectaries, fields, workshops, house parties, aircraft. Captions matter as much as pixels.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-sm border border-rule bg-paper-2 p-5">
            <h2 className="story-title text-lg">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-12 space-y-5 border-t border-rule pt-10">
        <div>
          <label htmlFor="kind" className="rail-title">
            What are you sending?
          </label>
          <select
            id="kind"
            name="kind"
            required
            className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base text-ink"
            defaultValue="story"
          >
            <option value="story">A story</option>
            <option value="gallery">Photo gallery notes</option>
            <option value="profile">Profile update</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="rail-title">
              Your name
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="email" className="rail-title">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
            />
          </div>
        </div>
        <div>
          <label htmlFor="title" className="rail-title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. The night the generator failed"
            className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
          />
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
          <p className={`text-sm ${status === 'ok' ? 'text-accent' : 'text-red-800'}`}>{message}</p>
        ) : null}
      </form>

      <p className="mt-10 text-sm text-ink-faint">
        Prefer Studio access for ongoing editing?{' '}
        <Link href="/join" className="underline decoration-rule hover:text-accent">
          Create a profile
        </Link>{' '}
        and we will follow up.
      </p>
    </main>
  )
}
