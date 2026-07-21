import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {STORY_QUERY} from '@/sanity/queries'
import {StoryBody} from '@/components/StoryBody'
import {urlFor} from '@/sanity/image'
import {fallbackStory} from '@/lib/fallback-content'

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
  const story =
    (await client.fetch(STORY_QUERY, {slug}).catch(() => null)) || fallbackStory(slug)

  if (!story) return notFound()

  const imageUrl = story.mainImage ? urlFor(story.mainImage).width(1600).height(900).url() : null

  return (
    <main className="pb-20">
      <article>
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8 md:py-16">
            <Link href="/stories" className="text-sm text-ink-faint hover:text-accent">
              ← Stories
            </Link>
            <p className="rail-title mt-8">
              {[story.year, story.location].filter(Boolean).join(' · ')}
            </p>
            <h1 className="story-title mt-4 text-4xl text-ink md:text-5xl lg:text-[3.25rem]">
              {story.title}
            </h1>
            {story.excerpt ? (
              <p className="mt-5 text-xl leading-relaxed text-ink-soft md:text-2xl">
                {story.excerpt}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-faint">
              {story.narrator?.name ? (
                <p>
                  Told by{' '}
                  {story.narrator.slug ? (
                    <Link
                      href={`/people/${story.narrator.slug}`}
                      className="text-ink-soft underline decoration-rule hover:text-accent"
                    >
                      {story.narrator.name}
                    </Link>
                  ) : (
                    story.narrator.name
                  )}
                </p>
              ) : null}
              {story.people?.length ? (
                <p>
                  With{' '}
                  {story.people.map((person: {slug?: string; name: string}, i: number) => (
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
                alt={(story.mainImage as {alt?: string})?.alt || story.title}
                width={1600}
                height={900}
                className="h-auto w-full rounded-sm"
                priority
              />
              {(story.mainImage as {caption?: string})?.caption ? (
                <p className="mt-3 text-sm text-ink-faint">
                  {(story.mainImage as {caption?: string}).caption}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-[var(--measure-wide)] px-5 py-12 md:px-8">
          <StoryBody value={story.body} />
        </div>
      </article>
    </main>
  )
}
