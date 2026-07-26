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
    <nav aria-label="More stories" className={cn('story-foot-nav', className)}>
      {previous ? (
        <Link
          href={`/stories/${previous.slug}`}
          className="story-foot-nav-link story-foot-nav-link--prev"
        >
          <Icon name="back" size={16} />
          <span className="min-w-0">
            <span className="story-foot-nav-label">Previous story</span>
            <span className="story-foot-nav-title">{previous.title}</span>
          </span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={`/stories/${next.slug}`}
          className="story-foot-nav-link story-foot-nav-link--next"
        >
          <span className="min-w-0">
            <span className="story-foot-nav-label">Next story</span>
            <span className="story-foot-nav-title">{next.title}</span>
          </span>
          <Icon name="forward" size={16} />
        </Link>
      ) : null}
    </nav>
  )
}
