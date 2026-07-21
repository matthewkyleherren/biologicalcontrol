import type {Metadata} from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/client'
import {GALLERY_QUERY} from '@/sanity/queries'
import {urlFor} from '@/sanity/image'
import {fallbackHome} from '@/lib/fallback-content'

export const revalidate = 60

type Props = {params: Promise<{slug: string}>}

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

  return (
    <main className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
      <Link href="/galleries" className="text-sm text-ink-faint hover:text-accent">
        ← Galleries
      </Link>
      <p className="rail-title mt-8">
        {[data.year, data.location].filter(Boolean).join(' · ')}
      </p>
      <h1 className="story-title mt-3 text-4xl md:text-5xl">{data.title}</h1>
      {data.description ? (
        <p className="mt-4 max-w-[40rem] text-xl leading-relaxed text-ink-soft">
          {data.description}
        </p>
      ) : null}

      {data.photos?.length ? (
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {data.photos.map((photo: { _key?: string; alt?: string; caption?: string }, i: number) => {
            const src = urlFor(photo).width(900).url()
            return (
              <figure key={photo._key || i} className="mb-4 break-inside-avoid">
                <Image
                  src={src}
                  alt={photo.alt || data.title}
                  width={900}
                  height={700}
                  className="h-auto w-full rounded-sm"
                />
                {photo.caption ? (
                  <figcaption className="mt-2 text-sm text-ink-faint">{photo.caption}</figcaption>
                ) : null}
              </figure>
            )
          })}
        </div>
      ) : (
        <div className="mt-12 rounded-sm border border-dashed border-rule bg-paper-2 px-6 py-16 text-center">
          <p className=" text-lg text-ink-soft">
            No photographs uploaded yet for this gallery.
          </p>
          <Link
            href="/contribute"
            className="mt-4 inline-block text-sm text-accent underline decoration-rule"
          >
            Add the first ones →
          </Link>
        </div>
      )}
    </main>
  )
}
