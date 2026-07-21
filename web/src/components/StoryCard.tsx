import Link from 'next/link'
import Image from 'next/image'
import {urlFor} from '@/sanity/image'

type StoryCardProps = {
  title: string
  slug: string
  excerpt?: string | null
  year?: number | null
  location?: string | null
  narrator?: {name?: string; slug?: string} | null
  mainImage?: {alt?: string} | null
  featured?: boolean
}

export function StoryCard({
  title,
  slug,
  excerpt,
  year,
  location,
  narrator,
  mainImage,
}: StoryCardProps) {
  const imageUrl = mainImage ? urlFor(mainImage).width(900).height(560).url() : null

  return (
    <article className="group grid min-w-0 gap-4 border-b border-rule py-8 last:border-b-0 md:grid-cols-[1.4fr_1fr] md:gap-8">
      <div className="min-w-0">
        <p className="rail-title">
          {[year, location].filter(Boolean).join(' · ') || 'Undated'}
        </p>
        <h2 className="story-title mt-2 text-2xl text-ink md:text-[1.75rem]">
          <Link href={`/stories/${slug}`} className="transition-colors group-hover:text-accent">
            {title}
          </Link>
        </h2>
        {excerpt ? (
          <p className="mt-3 max-w-[38rem] text-lg leading-relaxed text-ink-soft">
            {excerpt}
          </p>
        ) : null}
        {narrator?.name ? (
          <p className="mt-4 text-sm text-ink-faint">
            Told by{' '}
            {narrator.slug ? (
              <Link href={`/people/${narrator.slug}`} className="text-ink-soft underline decoration-rule hover:text-accent">
                {narrator.name}
              </Link>
            ) : (
              narrator.name
            )}
          </p>
        ) : null}
      </div>
      {imageUrl ? (
        <Link href={`/stories/${slug}`} className="relative block min-w-0 overflow-hidden rounded-sm">
          <Image
            src={imageUrl}
            alt={(mainImage as {alt?: string})?.alt || title}
            width={900}
            height={560}
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.02]"
          />
        </Link>
      ) : (
        <div className="hidden min-h-36 rounded-sm bg-paper-2 md:block" aria-hidden />
      )}
    </article>
  )
}
