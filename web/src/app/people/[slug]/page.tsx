import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {PERSON_QUERY} from '@/sanity/queries'
import {StoryBody} from '@/components/StoryBody'
import {urlFor} from '@/sanity/image'
import {fallbackHome} from '@/lib/fallback-content'
import {Avatar, ButtonLink, EmptyState} from '@/components/ui'
import {ProfileHeader} from '@/components/profile/ProfileHeader'

export const revalidate = 60

type Props = {params: Promise<{slug: string}>}

type StoryRow = {
  _id: string
  slug: string
  title: string
  year?: number | null
  excerpt?: string | null
}

type GalleryRow = {
  _id: string
  slug: string
  title: string
  year?: number | null
}

type PersonDetail = {
  _id?: string
  name: string
  slug: string
  role?: string | null
  yearsActive?: string | null
  location?: string | null
  portrait?: {alt?: string} | null
  bio?: unknown
  stories?: StoryRow[] | null
  galleries?: GalleryRow[] | null
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const person = await client.fetch(PERSON_QUERY, {slug}).catch(() => null)
  const fallback = fallbackHome.people.find((p) => p.slug === slug)
  const name = person?.name || fallback?.name
  return {title: name || 'Person'}
}

export default async function PersonPage({params}: Props) {
  const {slug} = await params
  const person = (await client.fetch(PERSON_QUERY, {slug}).catch(() => null)) as PersonDetail | null
  const fallback = fallbackHome.people.find((p) => p.slug === slug)

  if (!person && !fallback) return notFound()

  const data: PersonDetail = person ?? {
    ...fallback!,
    bio: null,
    stories: [],
    galleries: [],
    portrait: null,
  }

  const portraitUrl = data.portrait
    ? urlFor(data.portrait as never)
        .width(320)
        .height(320)
        .fit('crop')
        .url()
    : null

  const stories = data.stories ?? []
  const galleries = data.galleries ?? []
  const firstName = data.name.split(/\s+/)[0] ?? data.name

  return (
    <main className="container container-narrow py-6 md:py-10">
      <ButtonLink href="/people" variant="ghost" icon="back" className="-ml-3">
        People
      </ButtonLink>

      <ProfileHeader
        className="mt-4"
        media={<Avatar name={data.name} src={portraitUrl} size="xl" ring />}
        name={data.name}
        facts={[data.role, data.yearsActive, data.location]}
        actions={
          <ButtonLink href="/contribute" variant="secondary" icon="compose">
            Share a story
          </ButtonLink>
        }
      />

      <div className="mt-8 border-t border-rule pt-8">
        {data.bio ? (
          <StoryBody value={data.bio} />
        ) : (
          <p className="max-w-[65ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            No biography here yet — the card was built from programme records. If this is you, claim
            it in{' '}
            <Link href="/settings" className="underline decoration-rule hover:text-accent">
              your settings
            </Link>
            ; if you worked with {firstName},{' '}
            <Link href="/contribute" className="underline decoration-rule hover:text-accent">
              write down what you remember
            </Link>
            .
          </p>
        )}
      </div>

      {stories.length ? (
        <section aria-labelledby="person-stories" className="mt-10 border-t border-rule pt-8">
          <h2 id="person-stories" className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">
            Stories
          </h2>
          <ul className="mt-4 list">
            {stories.map((story) => (
              <li key={story._id} className="list-row">
                <Link href={`/stories/${story.slug}`} className="group min-w-0 flex-1 py-1">
                  {story.year ? <p className="meta-line font-mono">{story.year}</p> : null}
                  <p className="text-[1.1875rem] font-semibold tracking-[-0.02em] text-ink group-hover:text-accent">
                    {story.title}
                  </p>
                  {story.excerpt ? (
                    <p className="mt-1 max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
                      {story.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {galleries.length ? (
        <section aria-labelledby="person-galleries" className="mt-10 border-t border-rule pt-8">
          <h2
            id="person-galleries"
            className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink"
          >
            Photographs
          </h2>
          <ul className="mt-4 list">
            {galleries.map((gallery) => (
              <li key={gallery._id} className="list-row">
                <Link href={`/galleries/${gallery.slug}`} className="group min-w-0 flex-1 py-1">
                  {gallery.year ? <p className="meta-line font-mono">{gallery.year}</p> : null}
                  <p className="text-[1.1875rem] font-semibold tracking-[-0.02em] text-ink group-hover:text-accent">
                    {gallery.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!stories.length && !galleries.length ? (
        <div className="mt-10">
          <EmptyState
            icon="stories"
            title={`Nothing in the archive names ${firstName} yet`}
            action={
              <ButtonLink href="/contribute" variant="primary" icon="compose">
                Share a story
              </ButtonLink>
            }
          >
            Stories and photographs that mention this person will be listed here once an editor adds
            them.
          </EmptyState>
        </div>
      ) : null}
    </main>
  )
}
