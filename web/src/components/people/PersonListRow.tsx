import Link from 'next/link'
import {urlFor} from '@/sanity/image'
import {Avatar} from '@/components/ui'
import type {PersonSummary} from '@/lib/types'

/** Dense mobile row: avatar, name, role, years. Missing fields are omitted. */
export function PersonListRow({name, slug, role, yearsActive, portrait}: PersonSummary) {
  const imageUrl = portrait ? urlFor(portrait).width(96).height(96).fit('crop').url() : null

  return (
    <li>
      <Link href={`/people/${slug}`} className="list-row">
        <Avatar name={name} src={imageUrl} size="md" />
        <span className="min-w-0 flex-1">
          {/* The name never truncates: looking someone up by name is the whole
              point of this page, and "Peter Neuenschwa…" defeats it. */}
          <span className="block text-[1.0625rem] leading-tight font-semibold text-ink [overflow-wrap:anywhere]">
            {name}
          </span>
          {role ? <span className="mt-0.5 block truncate-1 text-base text-ink-soft">{role}</span> : null}
          {yearsActive ? (
            <span className="mt-1 block font-mono text-[0.8125rem] text-ink-faint sm:hidden">
              {yearsActive}
            </span>
          ) : null}
        </span>
        {yearsActive ? (
          <span className="hidden shrink-0 font-mono text-[0.8125rem] text-ink-faint sm:inline">
            {yearsActive}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
