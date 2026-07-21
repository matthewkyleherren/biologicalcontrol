'use client'

import {useState} from 'react'
import Link from 'next/link'

export default function JoinPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = new FormData(e.currentTarget)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        role: form.get('role'),
        yearsActive: form.get('yearsActive'),
        location: form.get('location'),
        bio: form.get('bio'),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setStatus('ok')
      setMessage(data.message || 'Profile submitted.')
      e.currentTarget.reset()
    } else {
      setStatus('error')
      setMessage(data.error || 'Could not create profile yet.')
    }
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <Link href="/people" className="text-sm text-ink-faint hover:text-accent">
        ← People
      </Link>
      <p className="rail-title mt-8">Profiles</p>
      <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Create a profile</h1>
      <p className="mt-5 text-xl leading-relaxed text-ink-soft">
        So people can find you again. Families welcome — staff, spouses, partners, kids who grew
        up on station. Start with a name, how you were connected, and the years; deepen the
        biography later.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="rail-title">
              Full name
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
              Email (private)
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="role" className="rail-title">
              How you were connected
            </label>
            <input
              id="role"
              name="role"
              placeholder="Entomologist, spouse, kid on station, pilot…"
              className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="yearsActive" className="rail-title">
              Years around the programme
            </label>
            <input
              id="yearsActive"
              name="yearsActive"
              placeholder="1983–1989"
              className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
            />
          </div>
        </div>
        <div>
          <label htmlFor="location" className="rail-title">
            Primary base
          </label>
          <input
            id="location"
            name="location"
            placeholder="Ibadan, Cotonou…"
            className="mt-2 min-h-11 w-full rounded-md border border-rule bg-paper px-3 py-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="bio" className="rail-title">
            Short bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={6}
            placeholder="A few sentences is plenty — what you remember, who you miss finding."
            className="mt-2 w-full rounded-md border border-rule bg-paper px-3 py-3 text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary disabled:opacity-60"
        >
          {status === 'loading' ? 'Creating…' : 'Create profile'}
        </button>
        {status === 'ok' || status === 'error' ? (
          <p className={`text-sm ${status === 'ok' ? 'text-accent' : 'text-red-800'}`}>{message}</p>
        ) : null}
      </form>
    </main>
  )
}
