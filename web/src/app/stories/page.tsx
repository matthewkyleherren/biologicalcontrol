import type {Metadata} from 'next'
import {client} from '@/sanity/client'
import {ALL_STORIES_QUERY} from '@/sanity/queries'
import {StoryCard} from '@/components/StoryCard'
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
    <main className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
      <p className="rail-title">Archive</p>
      <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Stories</h1>
      <p className="mt-4 max-w-[36rem] text-xl leading-relaxed text-ink-soft">
        Short tellings from the field, the insectary, the air, and the compound after hours.
        Folklore lives in detail — names, nights, jokes, near-misses. Staff and family voices
        belong here equally.
      </p>
      <div className="mt-4">
        {list.map((story) => (
          <StoryCard key={story._id} {...story} slug={story.slug} />
        ))}
      </div>
    </main>
  )
}
