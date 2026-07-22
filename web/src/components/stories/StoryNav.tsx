import Link from 'next/link'
import {Icon} from '@/components/ui'
import {cn} from '@/lib/cn'

export type StoryNavItem = {
  title: string
  slug: string
}

type StoryNavProps = {
  previous?: StoryNavItem | null
  next?: StoryNavItem | null
  className?: string
}

/**
 * Previous/next links at the foot of a story, ordered the same way as the
 * index. Titles truncate to one line — at 320px there is no room for a
 * clickable label to wrap.
 */
export function StoryNav({previous, next, className}: StoryNavProps) {
  if (!previous && !next) return null

  return (
    <nav aria-label="More stories" className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {previous ? (
        <Link
          href={`/stories/${previous.slug}`}
          className="card card--interactive group flex min-w-0 items-center gap-3 p-4 sm:mr-auto sm:max-w-[20rem]"
        >
          <Icon name="back" size={18} className="shrink-0 text-ink-faint" />
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Previous story
            </span>
            <span className="truncate-1 block text-base font-medium text-ink group-hover:text-accent">
              {previous.title}
            </span>
          </span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={`/stories/${next.slug}`}
          className="card card--interactive group flex min-w-0 items-center justify-end gap-3 p-4 text-right sm:ml-auto sm:max-w-[20rem]"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Next story
            </span>
            <span className="truncate-1 block text-base font-medium text-ink group-hover:text-accent">
              {next.title}
            </span>
          </span>
          <Icon name="forward" size={18} className="shrink-0 text-ink-faint" />
        </Link>
      ) : null}
    </nav>
  )
}
