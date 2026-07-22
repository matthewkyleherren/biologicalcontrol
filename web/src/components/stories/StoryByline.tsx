import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {Avatar} from '@/components/ui'
import {urlFor} from '@/sanity/image'
import {cn} from '@/lib/cn'

export type StoryNarrator = {
  name?: string
  slug?: string
  portrait?: SanityImageSource | null
}

type StoryBylineProps = {
  narrator?: StoryNarrator | null
  /** `sm` for the index card, `md` for the reading page. */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * "Told by <name>" with the narrator's portrait — a small Avatar when it
 * resolves to a person with a portrait, initials otherwise. Shared between
 * the story card and the reading page so the byline never drifts between them.
 */
export function StoryByline({narrator, size = 'sm', className}: StoryBylineProps) {
  if (!narrator?.name) return null

  const portraitUrl = narrator.portrait ? urlFor(narrator.portrait).width(96).height(96).url() : null

  return (
    <p
      className={cn(
        'flex items-center gap-2',
        size === 'md' ? 'text-base text-ink-soft' : 'text-sm text-ink-faint',
        className
      )}
    >
      <Avatar name={narrator.name} src={portraitUrl} size={size === 'md' ? 'sm' : 'xs'} />
      <span className="min-w-0">
        Told by{' '}
        {narrator.slug ? (
          <Link
            href={`/people/${narrator.slug}`}
            className="font-medium text-ink underline decoration-rule underline-offset-[0.18em] hover:text-accent hover:decoration-accent"
          >
            {narrator.name}
          </Link>
        ) : (
          <span className="font-medium text-ink">{narrator.name}</span>
        )}
      </span>
    </p>
  )
}
