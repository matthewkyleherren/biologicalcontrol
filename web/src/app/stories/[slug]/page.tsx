import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {ALL_STORIES_QUERY, STORY_QUERY} from '@/sanity/queries'
import {StoryBody} from '@/components/StoryBody'
import {StoryNav} from '@/components/stories/StoryNav'
import {StoryReader} from '@/components/stories/StoryReader'
import {ButtonLink} from '@/components/ui'
import {urlFor} from '@/sanity/image'
import {fallbackStories, fallbackStory} from '@/lib/fallback-content'
import {countWords} from '@/lib/portable-text'
import {extractHeadings} from '@/lib/story-headings'
import type {StorySummary} from '@/lib/types'

export const revalidate = 60

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const story =
    (await client.fetch(STORY_QUERY, {slug}).catch(() => null)) || fallbackStory(slug)
  if (!story) return {title: 'Story'}
  return {
    title: story.title,
    description: story.excerpt || undefined,
  }
}

export default async function StoryPage({params}: Props) {
  const {slug} = await params
  const [story, allStories] = await Promise.all([
    client.fetch(STORY_QUERY, {slug}).catch(() => null),
    client.fetch(ALL_STORIES_QUERY).catch(() => []) as Promise<StorySummary[]>,
  ])

  const resolved = story || fallbackStory(slug)
  if (!resolved) return notFound()

  const orderedList: StorySummary[] = allStories.length ? allStories : fallbackStories
  const currentIndex = orderedList.findIndex((s) => s.slug === slug)
  const previous = currentIndex > 0 ? orderedList[currentIndex - 1] : null
  const next =
    currentIndex > -1 && currentIndex < orderedList.length - 1 ? orderedList[currentIndex + 1] : null

  const imageUrl = resolved.mainImage
    ? urlFor(resolved.mainImage).width(1600).height(900).url()
    : null
  const wordCount = countWords(resolved.body)
  const headings = extractHeadings(resolved.body)
  const authorName = resolved.narrator?.name || null
  const authorHref = resolved.narrator?.slug ? `/people/${resolved.narrator.slug}` : null

  return (
    <main className="pb-8">
      <StoryReader
        title={resolved.title}
        slug={resolved.slug}
        excerpt={resolved.excerpt}
        wordCount={wordCount}
        authorName={authorName}
        authorHref={authorHref}
        previous={previous}
        next={next}
        headings={headings}
        tocStories={orderedList.map((item) => ({
          title: item.title,
          slug: item.slug,
          year: item.year,
        }))}
      >
        {imageUrl ? (
          <figure className="story-paper-image">
            <Image
              src={imageUrl}
              alt={(resolved.mainImage as {alt?: string})?.alt || resolved.title}
              width={1600}
              height={900}
              priority
            />
            {(resolved.mainImage as {caption?: string})?.caption ? (
              <figcaption>{(resolved.mainImage as {caption?: string}).caption}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <StoryBody value={resolved.body} />

        {resolved.people?.length ? (
          <p className="story-with">
            With{' '}
            {resolved.people.map((person: {slug?: string; name: string}, i: number) => (
              <span key={person.slug || person.name}>
                {i > 0 ? ', ' : ''}
                {person.slug ? (
                  <Link href={`/people/${person.slug}`}>{person.name}</Link>
                ) : (
                  person.name
                )}
              </span>
            ))}
          </p>
        ) : null}

        <div className="story-paper-foot">
          <StoryNav previous={previous} next={next} />
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="story-foot-prompt">Have a memory like this one?</p>
            <ButtonLink href="/contribute" variant="secondary" icon="compose">
              Share a story of your own
            </ButtonLink>
          </div>
        </div>
      </StoryReader>
    </main>
  )
}
