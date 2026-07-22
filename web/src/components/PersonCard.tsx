import Link from 'next/link'
import {urlFor} from '@/sanity/image'
import {Avatar} from '@/components/ui'

type PersonCardProps = {
  name: string
  slug: string
  role?: string | null
  yearsActive?: string | null
  location?: string | null
  portrait?: {alt?: string} | null
}

/**
 * A restrained card — a quiet nod to the old business-card idea (hairline
 * rule, mono meta row) without the invented inventory code, rotated stamp,
 * or "Station TBD" filler. Missing fields are simply omitted.
 */
export function PersonCard({name, slug, role, yearsActive, location, portrait}: PersonCardProps) {
  const imageUrl = portrait ? urlFor(portrait).width(160).height(160).fit('crop').url() : null
  const hasMeta = Boolean(yearsActive || location)

  return (
    <Link
      href={`/people/${slug}`}
      className="card card--interactive group flex min-w-0 flex-col gap-3 p-4"
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} src={imageUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-tight font-semibold text-ink [overflow-wrap:anywhere] group-hover:text-accent">
            {name}
          </p>
          {role ? <p className="truncate-1 mt-0.5 text-base text-ink-soft">{role}</p> : null}
        </div>
      </div>
      {hasMeta ? (
        <dl className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-rule pt-3 font-mono text-[0.8125rem] text-ink-faint">
          {yearsActive ? (
            <div>
              <dt className="sr-only">Years active</dt>
              <dd>{yearsActive}</dd>
            </div>
          ) : null}
          {yearsActive && location ? <span aria-hidden="true">·</span> : null}
          {location ? (
            <div className="min-w-0">
              <dt className="sr-only">Location</dt>
              <dd className="truncate-1">{location}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </Link>
  )
}
