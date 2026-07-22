import Image from 'next/image'
import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {Icon} from '@/components/ui'
import {urlFor} from '@/sanity/image'

export type GalleryCover = {alt?: string | null; asset?: {_ref?: string | null} | null} | null

export type GalleryCardProps = {
  slug: string
  title: string
  year?: number | null
  location?: string | null
  photoCount?: number | null
  /** `GALLERIES_QUERY` returns the gallery's first photograph as `cover`. */
  cover?: GalleryCover
}

const COVER_WIDTH = 720
const COVER_HEIGHT = 540

/**
 * A gallery is a stack of photographs, so the card leads with one. The card only
 * ever shows a picture it actually has: with no cover it says so plainly rather
 * than dressing a text tile up as a photo gallery.
 */
export function GalleryCard({slug, title, year, location, photoCount, cover}: GalleryCardProps) {
  const count = photoCount ?? 0
  const meta = [year, location].filter(Boolean).join(' · ')
  const hasCover = Boolean(cover?.asset?._ref)

  return (
    <Link
      href={`/galleries/${slug}`}
      className="card card--interactive block min-w-0 overflow-hidden"
    >
      {hasCover ? (
        <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden bg-paper-3">
          <Image
            src={urlFor(cover as SanityImageSource)
              .width(COVER_WIDTH)
              .height(COVER_HEIGHT)
              .fit('crop')
              .auto('format')
              .url()}
            alt={cover?.alt?.trim() || `Photograph from ${title}`}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 22rem"
            className="max-w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full min-w-0 flex-col items-center justify-center gap-2 border-b border-dashed border-rule bg-paper-2 px-4 text-center">
          <Icon name="camera" size={28} strokeWidth={1.4} className="text-ink-faint" />
          <p className="text-[0.9375rem] font-semibold text-ink-faint">No photographs yet</p>
        </div>
      )}

      <div className="p-4 md:p-5">
        <h2 className="text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
          {title}
        </h2>
        {meta ? <p className="meta-line mt-1">{meta}</p> : null}
        <p className="mt-3 font-mono text-[0.9375rem] tabular-nums text-ink-faint">
          {count === 1 ? '1 photograph' : `${count} photographs`}
        </p>
      </div>
    </Link>
  )
}
