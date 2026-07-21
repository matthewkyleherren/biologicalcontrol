import type {Metadata} from 'next'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {PersonCard} from '@/components/PersonCard'
import {fallbackHome} from '@/lib/fallback-content'
import type {PersonSummary} from '@/lib/types'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'People',
  description:
    'Find colleagues, partners, and compound neighbours from the IITA Biological Control Programme. Families welcome.',
}

export const revalidate = 60

export default async function PeoplePage() {
  const people = (await client.fetch(PEOPLE_QUERY).catch(() => [])) as PersonSummary[]
  const list = people.length ? people : fallbackHome.people

  return (
    <main className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="rail-title">Directory</p>
          <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Who was there</h1>
          <p className="mt-4 max-w-[36rem] text-xl leading-relaxed text-ink-soft">
            Look up old colleagues, national-programme friends, and compound neighbours. Claim a
            card — families welcome. These are warm placeholders in an IITA-era stationery style
            until the real business cards turn up from a drawer.
          </p>
        </div>
        <Link href="/join" className="btn-primary shrink-0">
          Create a profile
        </Link>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((person) => (
          <PersonCard key={person._id} {...person} slug={person.slug} />
        ))}
      </div>
    </main>
  )
}
