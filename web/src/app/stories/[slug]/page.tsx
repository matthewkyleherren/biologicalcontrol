import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {ALL_STORIES_QUERY, STORY_QUERY} from '@/sanity/queries'
import {StoryBody} from '@/components/StoryBody'
import {StoryByline} from '@/components/stories/StoryByline'
import {StoryNav} from '@/components/stories/StoryNav'
import {ButtonLink} from '@/components/ui'
import {urlFor} from '@/sanity/image'
import {fallbackStories, fallbackStory} from '@/lib/fallback-content'
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

  // Previous/next follow the same order the index renders: ALL_STORIES_QUERY,
  // year ascending, with the same fallback list when Sanity is empty.
  const orderedList: StorySummary[] = allStories.length ? allStories : fallbackStories
  const currentIndex = orderedList.findIndex((s) => s.slug === slug)
  const previous = currentIndex > 0 ? orderedList[currentIndex - 1] : null
  const next =
    currentIndex > -1 && currentIndex < orderedList.length - 1 ? orderedList[currentIndex + 1] : null

  const imageUrl = resolved.mainImage ? urlFor(resolved.mainImage).width(1600).height(900).url() : null

  return (
    <main className="pb-20">
      <article>
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
            <Link href="/stories" className="text-sm text-ink-faint hover:text-accent">
              ← Stories
            </Link>
            <p className="rail-title mt-8">
              {[resolved.year, resolved.location].filter(Boolean).join(' · ')}
            </p>
            <h1 className="story-title mt-4 text-4xl text-ink md:text-5xl lg:text-[3.25rem]">
              {resolved.title}
            </h1>
            {resolved.excerpt ? (
              <p className="mt-5 text-xl leading-relaxed text-ink-soft md:text-2xl">
                {resolved.excerpt}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <StoryByline narrator={resolved.narrator} size="md" />
              {resolved.people?.length ? (
                <p className="text-sm text-ink-faint">
                  With{' '}
                  {resolved.people.map((person: {slug?: string; name: string}, i: number) => (
                    <span key={person.slug || person.name}>
                      {i > 0 ? ', ' : ''}
                      {person.slug ? (
                        <Link
                          href={`/people/${person.slug}`}
                          className="text-ink-soft underline decoration-rule hover:text-accent"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        person.name
                      )}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {imageUrl ? (
          <div className="border-b border-rule bg-paper-2">
            <div className="mx-auto max-w-[56rem] px-5 py-8 md:px-8">
              <Image
                src={imageUrl}
                alt={(resolved.mainImage as {alt?: string})?.alt || resolved.title}
                width={1600}
                height={900}
                className="h-auto w-full rounded-sm"
                priority
              />
              {(resolved.mainImage as {caption?: string})?.caption ? (
                <p className="mt-3 text-sm text-ink-faint">
                  {(resolved.mainImage as {caption?: string}).caption}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8">
          <StoryBody value={resolved.body} />

          <div className="mt-14 border-t border-rule pt-10">
            <StoryNav previous={previous} next={next} />
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-ink-soft">Have a memory like this one?</p>
              <ButtonLink href="/contribute" variant="secondary" icon="compose">
                Share a story of your own
              </ButtonLink>
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
