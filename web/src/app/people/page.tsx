import type {Metadata} from 'next'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {fallbackHome} from '@/lib/fallback-content'
import type {PersonSummary} from '@/lib/types'
import {ButtonLink, PageHeader} from '@/components/ui'
import {PeopleDirectory} from '@/components/people/PeopleDirectory'

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
    <main className="mx-auto max-w-[var(--site-max)] px-5 pb-16 md:px-8">
      <PageHeader
        title="Who was there"
        subtitle="Look up old colleagues, national-programme friends, and compound neighbours."
        action={
          <ButtonLink href="/join" icon="plus">
            Create a profile
          </ButtonLink>
        }
      />
      <PeopleDirectory people={list} />
    </main>
  )
}
