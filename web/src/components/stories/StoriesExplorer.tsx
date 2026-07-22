'use client'

import {useId, useMemo, useState} from 'react'
import {SearchInput, EmptyState, Button} from '@/components/ui'
import {StoryCard} from '@/components/StoryCard'
import type {StorySummary} from '@/lib/types'

type Props = {
  stories: StorySummary[]
}

function decadeOf(year?: number | null): number | null {
  return typeof year === 'number' ? Math.floor(year / 10) * 10 : null
}

/**
 * Client half of the story index: search across title, excerpt, narrator,
 * location and year, plus optional decade chips when the year data actually
 * supports them. The server component keeps the Sanity fetch and fallback.
 */
export function StoriesExplorer({stories}: Props) {
  const [query, setQuery] = useState('')
  const [decade, setDecade] = useState<number | null>(null)
  const countId = useId()

  const decades = useMemo(() => {
    const set = new Set<number>()
    for (const story of stories) {
      const d = decadeOf(story.year)
      if (d !== null) set.add(d)
    }
    return Array.from(set).sort((a, b) => a - b)
  }, [stories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stories.filter((story) => {
      if (decade !== null && decadeOf(story.year) !== decade) return false
      if (!q) return true
      const haystack = [
        story.title,
        story.excerpt,
        story.narrator?.name,
        story.location,
        story.year != null ? String(story.year) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [stories, query, decade])

  const isFiltering = query.trim().length > 0 || decade !== null

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          label="Search stories"
          placeholder="Search by title, name, year, or place…"
          className="w-full sm:max-w-sm"
        />
        <p id={countId} className="meta-line shrink-0" aria-live="polite" aria-atomic="true">
          {isFiltering
            ? `${filtered.length} of ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`
            : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
        </p>
      </div>

      {decades.length >= 2 ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by decade">
          <button type="button" className="chip" aria-pressed={decade === null} onClick={() => setDecade(null)}>
            All years
          </button>
          {decades.map((d) => (
            <button
              key={d}
              type="button"
              className="chip"
              aria-pressed={decade === d}
              onClick={() => setDecade((current) => (current === d ? null : d))}
            >
              {d}s
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length ? (
        <div className="mt-4">
          {filtered.map((story) => (
            <StoryCard key={story._id} {...story} slug={story.slug} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="No stories match"
          className="mt-8"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setDecade(null)
              }}
            >
              Clear filters
            </Button>
          }
        >
          Try a different name, year, or place — or clear the search to see every story.
        </EmptyState>
      )}
    </div>
  )
}
