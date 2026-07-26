'use client'

import {useCallback, useEffect, useState} from 'react'
import {Show, SignInButton, useAuth} from '@clerk/nextjs'
import {apiFetch} from '@/lib/api'
import {Alert, Button, EmptyState, PageHeader} from '@/components/ui'

type PendingStory = {
  _id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  year: number | null
  location: string | null
  era: string | null
  reviewStatus: string | null
  createdAt: string | null
  bodyText: string | null
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default function ReviewPage() {
  const {getToken, isLoaded} = useAuth()
  const tokenFn = useCallback(() => getToken(), [getToken])

  const [stories, setStories] = useState<PendingStory[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isLoaded) return
    setStatus('loading')
    setMessage('')
    try {
      const data = await apiFetch<{stories: PendingStory[]}>('/stories/pending', {
        getAccessToken: tokenFn,
      })
      setStories(data.stories ?? [])
      setStatus('ready')
    } catch (err) {
      const text = errorMessage(err, 'Could not load the review queue.')
      if (/403|editor role/i.test(text)) {
        setStatus('forbidden')
        setMessage('This page is for editors. Your account needs the editor or admin role.')
      } else {
        setStatus('error')
        setMessage(text)
      }
    }
  }, [isLoaded, tokenFn])

  useEffect(() => {
    void load()
  }, [load])

  async function setReview(id: string, next: 'approved' | 'rejected') {
    setBusyId(id)
    setMessage('')
    try {
      await apiFetch(`/stories/${id}/review`, {
        method: 'PATCH',
        getAccessToken: tokenFn,
        body: {status: next},
      })
      setStories((prev) => prev.filter((story) => story._id !== id))
    } catch (err) {
      setMessage(errorMessage(err, 'Could not update that story.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
      <PageHeader
        title="Review submissions"
        subtitle="Community stories wait here until you approve them for the public archive."
      />

      <Show when="signed-out">
        <div className="mt-8">
          <EmptyState
            icon="compose"
            title="Sign in to review stories"
            action={
              <SignInButton mode="modal" forceRedirectUrl="/review">
                <Button variant="primary">Sign in</Button>
              </SignInButton>
            }
          >
            Only editors and admins can approve community submissions.
          </EmptyState>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="mt-8 space-y-5">
          {message ? <Alert tone={status === 'forbidden' ? 'error' : 'error'}>{message}</Alert> : null}

          {status === 'loading' ? (
            <p className="text-lg text-ink-soft">Loading the queue…</p>
          ) : null}

          {status === 'forbidden' ? (
            <EmptyState icon="alert" title="Editors only">
              Ask an admin to set your role to editor if you should review submissions.
            </EmptyState>
          ) : null}

          {status === 'ready' && stories.length === 0 ? (
            <EmptyState icon="check" title="Nothing waiting">
              When someone sends a story from Contribute, it will appear here first.
            </EmptyState>
          ) : null}

          {status === 'ready'
            ? stories.map((story) => (
                <article
                  key={story._id}
                  className="space-y-3 border-t border-rule py-6 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="story-title text-2xl md:text-3xl">
                      {story.title || 'Untitled story'}
                    </h2>
                    <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-faint">
                      Pending
                    </p>
                  </div>
                  <p className="font-mono text-sm text-ink-faint">
                    {[story.year, story.location, story.createdAt?.slice(0, 10)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="max-w-[46ch] text-lg leading-relaxed text-ink-soft whitespace-pre-wrap">
                    {story.bodyText || story.excerpt || 'No text yet.'}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button
                      variant="primary"
                      loading={busyId === story._id}
                      onClick={() => void setReview(story._id, 'approved')}
                    >
                      Approve for archive
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busyId === story._id}
                      onClick={() => void setReview(story._id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </article>
              ))
            : null}

          {status === 'ready' || status === 'error' ? (
            <Button variant="ghost" onClick={() => void load()}>
              Refresh queue
            </Button>
          ) : null}
        </div>
      </Show>
    </main>
  )
}
