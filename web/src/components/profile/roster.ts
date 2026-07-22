import {urlFor} from '@/sanity/image'

/**
 * The historical roster, flattened for the client.
 *
 * `/me` and `/settings` both need the same shape: a person's Sanity `_id` (what
 * a claim is recorded against), their slug (what `/people/[slug]` needs), and a
 * portrait URL resolved on the server so the browser never loads the Sanity
 * image builder. Nothing here is invented — a missing role, years, or portrait
 * stays missing.
 */
export type RosterPerson = {
  id: string
  name: string
  slug: string
  role: string | null
  yearsActive: string | null
  location: string | null
  portraitUrl: string | null
}

type RawPerson = {
  _id?: string | null
  name?: string | null
  slug?: string | null
  role?: string | null
  yearsActive?: string | null
  location?: string | null
  portrait?: unknown
}

function portraitUrl(portrait: unknown): string | null {
  if (!portrait) return null
  try {
    return urlFor(portrait as never)
      .width(160)
      .height(160)
      .fit('crop')
      .url()
  } catch {
    return null
  }
}

export function toRoster(people: unknown): RosterPerson[] {
  if (!Array.isArray(people)) return []
  return (people as RawPerson[])
    .filter((p): p is RawPerson & {_id: string; name: string; slug: string} =>
      Boolean(p && p._id && p.name && p.slug)
    )
    .map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      role: p.role ?? null,
      yearsActive: p.yearsActive ?? null,
      location: p.location ?? null,
      portraitUrl: portraitUrl(p.portrait),
    }))
}

/** "Entomologist · 1984–89" — empty when the record says nothing. */
export function rosterFacts(person: Pick<RosterPerson, 'role' | 'yearsActive'>): string {
  return [person.role, person.yearsActive].filter(Boolean).join(' · ')
}
