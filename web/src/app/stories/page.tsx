import type {Metadata} from 'next'
import {client} from '@/sanity/client'
import {ALL_STORIES_QUERY} from '@/sanity/queries'
import {PageHeader, ButtonLink} from '@/components/ui'
import {StoriesExplorer} from '@/components/stories/StoriesExplorer'
import {fallbackStories} from '@/lib/fallback-content'
import type {StorySummary} from '@/lib/types'

export const metadata: Metadata = {
  title: 'Stories',
  description:
    'Oral history and folklore from the IITA Biological Control Programme community — staff, families, and friends of the compound.',
}

export const revalidate = 60

export default async function StoriesPage() {
  const stories = (await client.fetch(ALL_STORIES_QUERY).catch(() => [])) as StorySummary[]
  const list: StorySummary[] = stories.length ? stories : fallbackStories

  return (
    <main className="container pb-16 md:pb-20">
      <PageHeader
        title="Stories"
        subtitle="Short tellings from the field, the insectary, and the compound after hours."
        action={
          <ButtonLink href="/contribute" icon="compose">
            Share a story
          </ButtonLink>
        }
      />
      <StoriesExplorer stories={list} />
    </main>
  )
}
