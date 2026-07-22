'use client'

import {useId, useMemo, useState} from 'react'
import {PersonCard} from '@/components/PersonCard'
import {PersonListRow} from './PersonListRow'
import {Button, EmptyState, SearchInput} from '@/components/ui'
import type {PersonSummary} from '@/lib/types'

type PeopleDirectoryProps = {
  people: PersonSummary[]
}

/** Splits a location string like "Cotonou · Ibadan" into individual stations. */
function stationsFrom(location?: string | null): string[] {
  if (!location) return []
  return location
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Search, optional station chips, and the mobile-list / desktop-grid split.
 * Filtering is client-side over the full roster already fetched by the
 * server component — there is no directory search endpoint.
 */
export function PeopleDirectory({people}: PeopleDirectoryProps) {
  const [query, setQuery] = useState('')
  const [station, setStation] = useState<string | null>(null)
  const liveId = useId()

  // Stations are only offered as filter chips when they genuinely recur
  // across the roster — this never fabricates a facet the data doesn't have.
  const stationChips = useMemo(() => {
    const counts = new Map<string, number>()
    for (const person of people) {
      for (const name of stationsFrom(person.location)) {
        counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([name]) => name)
  }, [people])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return people.filter((person) => {
      if (station && !stationsFrom(person.location).includes(station)) return false
      if (!q) return true
      const haystack = [person.name, person.role, person.yearsActive, person.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [people, query, station])

  const trimmedQuery = query.trim()
  const isFiltering = Boolean(trimmedQuery) || Boolean(station)

  const filterLabel = trimmedQuery && station
    ? `"${trimmedQuery}" in ${station}`
    : trimmedQuery
      ? `"${trimmedQuery}"`
      : station
        ? station
        : ''

  const announcement = isFiltering
    ? `${filtered.length} ${filtered.length === 1 ? 'person matches' : 'people match'} ${filterLabel}`
    : ''

  function clearFilters() {
    setQuery('')
    setStation(null)
  }

  return (
    <div>
      <SearchInput
        value={query}
        onValueChange={setQuery}
        label="Search people by name, role, years, or location"
        placeholder="Search people…"
        className="sm:max-w-sm"
      />

      {stationChips.length ? (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by station">
          {stationChips.map((name) => {
            const pressed = station === name
            return (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={pressed}
                onClick={() => setStation(pressed ? null : name)}
              >
                {name}
              </button>
            )
          })}
        </div>
      ) : null}

      <p id={liveId} role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={`No one matches ${filterLabel || 'this search'}`}
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear search
            </Button>
          }
          className="mt-10"
        >
          Try a different name, role, or station — or clear the search to see everyone.
        </EmptyState>
      ) : (
        <>
          <ul className="list mt-6 sm:hidden">
            {filtered.map((person) => (
              <PersonListRow key={person._id} {...person} />
            ))}
          </ul>
          <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((person) => (
              <PersonCard key={person._id} {...person} slug={person.slug} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
