import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {PERSON_QUERY} from '@/sanity/queries'
import {StoryBody} from '@/components/StoryBody'
import {urlFor} from '@/sanity/image'
import {fallbackHome} from '@/lib/fallback-content'
import {inventoryCode} from '@/lib/types'

export const revalidate = 60

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const person = await client.fetch(PERSON_QUERY, {slug}).catch(() => null)
  const fallback = fallbackHome.people.find((p) => p.slug === slug)
  const name = person?.name || fallback?.name
  return {title: name || 'Person'}
}

export default async function PersonPage({params}: Props) {
  const {slug} = await params
  const person = await client.fetch(PERSON_QUERY, {slug}).catch(() => null)
  const fallback = fallbackHome.people.find((p) => p.slug === slug)

  if (!person && !fallback) return notFound()

  const data = person || {
    ...fallback!,
    bio: null,
    stories: [],
    galleries: [],
    portrait: null,
  }

  const imageUrl = data.portrait ? urlFor(data.portrait).width(480).height(480).url() : null
  const code = inventoryCode(slug)

  return (
    <main className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
      <Link href="/people" className="nav-link inline-flex px-0">
        ← People
      </Link>

      <article className="biz-card biz-card-profile mt-8 max-w-[42rem]">
        <div className="biz-card-inner">
          <div className="biz-card-stamp" aria-hidden>
            IITA
          </div>
          <div className="flex items-start justify-between gap-3">
            <p className="biz-card-inv">{code}</p>
            <p className="biz-card-org">Biol. Control · IITA</p>
          </div>
          <hr className="biz-card-rule" />
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:gap-6">
            <div className="biz-card-photo shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={(data.portrait as {alt?: string})?.alt || data.name}
                  width={480}
                  height={480}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="biz-card-initial text-4xl">{data.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="biz-card-name">{data.name}</h1>
              <p className="biz-card-role">{data.role || 'Programme member'}</p>
              <dl className="biz-card-meta">
                <div>
                  <dt>Station</dt>
                  <dd>{data.location || 'Station TBD'}</dd>
                </div>
                {data.yearsActive ? (
                  <div>
                    <dt>Years</dt>
                    <dd>{data.yearsActive}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      </article>

      <div className="mt-10 max-w-[42rem]">
        {data.bio ? (
          <StoryBody value={data.bio} />
        ) : (
          <p className="text-xl leading-relaxed text-ink-soft">
            Profile awaiting a fuller biography. If this is you — or someone you can help document
            —{' '}
            <Link href="/contribute" className="underline decoration-rule hover:text-accent">
              contribute a memory
            </Link>{' '}
            or{' '}
            <Link href="/join" className="underline decoration-rule hover:text-accent">
              create a profile
            </Link>
            .
          </p>
        )}
      </div>

      {data.stories?.length ? (
        <section className="mt-16 border-t border-rule pt-10">
          <p className="rail-title">Appears in</p>
          <ul className="mt-4 space-y-4">
            {data.stories.map(
              (story: {
                _id: string
                slug: string
                title: string
                year?: number
                excerpt?: string
              }) => (
                <li key={story._id}>
                  <Link href={`/stories/${story.slug}`} className="group block py-1">
                    <p className="text-sm text-ink-faint">{story.year}</p>
                    <p className="story-title text-xl group-hover:text-accent md:text-2xl">
                      {story.title}
                    </p>
                    {story.excerpt ? (
                      <p className="mt-1 max-w-[40rem] text-lg text-ink-soft">{story.excerpt}</p>
                    ) : null}
                  </Link>
                </li>
              )
            )}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
