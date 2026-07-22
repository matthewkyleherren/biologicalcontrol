import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {GALLERY_QUERY} from '@/sanity/queries'
import {fallbackHome} from '@/lib/fallback-content'
import {ButtonLink, EmptyState, PageHeader} from '@/components/ui'
import {GalleryPhotos} from '@/components/galleries/GalleryPhotos'
import {toLightboxPhotos, type SanityPhoto} from '@/components/galleries/photo-source'

export const revalidate = 60

type Props = {params: Promise<{slug: string}>}

type TaggedPerson = {name?: string | null; slug?: string | null}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const gallery = await client.fetch(GALLERY_QUERY, {slug}).catch(() => null)
  const fallback = fallbackHome.galleries.find((g) => g.slug === slug)
  return {title: gallery?.title || fallback?.title || 'Gallery'}
}

export default async function GalleryPage({params}: Props) {
  const {slug} = await params
  const gallery = await client.fetch(GALLERY_QUERY, {slug}).catch(() => null)
  const fallback = fallbackHome.galleries.find((g) => g.slug === slug)

  if (!gallery && !fallback) return notFound()

  const data = gallery || {...fallback!, photos: [], people: []}

  const photos = toLightboxPhotos(data.photos as SanityPhoto[] | null | undefined, data.title)
  const people = ((data.people ?? []) as TaggedPerson[]).filter((person) => person?.slug)

  const subtitle = [
    [data.year, data.location].filter(Boolean).join(' · '),
    photos.length === 1 ? '1 photograph' : `${photos.length} photographs`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <main className="container pb-14 md:pb-20">
      <div className="pt-4">
        <ButtonLink href="/galleries" variant="ghost" icon="back" className="-ml-3">
          All galleries
        </ButtonLink>
      </div>

      <PageHeader
        title={data.title}
        subtitle={subtitle}
        action={
          <ButtonLink href="/contribute" variant="secondary" icon="camera">
            Share photos
          </ButtonLink>
        }
      />

      {data.description ? (
        <p className="max-w-[65ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          {data.description}
        </p>
      ) : null}

      {people.length ? (
        <section className="mt-6">
          <h2 className="text-[1.0625rem] font-semibold text-ink">People in this gallery</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {people.map((person) => (
              <li key={person.slug}>
                {/* `.chip` is unlayered, so the 44px tap target has to shout. */}
                <Link href={`/people/${person.slug}`} className="chip min-h-11! px-4!">
                  {person.name || person.slug}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="sr-only">Photographs</h2>
        {photos.length ? (
          <GalleryPhotos photos={photos} galleryTitle={data.title} />
        ) : (
          <EmptyState
            icon="photos"
            title="No photographs here yet"
            action={
              <ButtonLink href="/contribute" icon="camera">
                Share photos
              </ButtonLink>
            }
          >
            This gallery is waiting on its first pictures. Envelopes, slide boxes, and family albums
            all count — send what you have and we will scan it.
          </EmptyState>
        )}
      </section>
    </main>
  )
}
