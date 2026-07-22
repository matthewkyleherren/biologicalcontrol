import {cn} from '@/lib/cn'

export type ProfileHeaderProps = {
  /** Avatar or portrait. Rendered at the start of the block, never cropped by text. */
  media: React.ReactNode
  name: string
  /** Short factual lines — role, years, station. Falsy entries are dropped, never filled in. */
  facts?: Array<string | null | undefined>
  /** A quiet standing line: "Editor", "Insectary 1984–89". */
  eyebrow?: string | null
  /** One sentence: how this person is connected. */
  note?: React.ReactNode
  /** Buttons. Two at most on mobile so nothing wraps to a second line. */
  actions?: React.ReactNode
  className?: string
}

/**
 * The one header block behind both `/me` and `/people/[slug]`, so a member's
 * page and a historical card read as the same kind of page rather than two
 * unrelated designs. Missing facts are omitted — there are no "TBD" fillers.
 */
export function ProfileHeader({
  media,
  name,
  facts = [],
  eyebrow,
  note,
  actions,
  className,
}: ProfileHeaderProps) {
  const shown = facts.filter((fact): fact is string => Boolean(fact && fact.trim()))

  return (
    <header className={cn('flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7', className)}>
      <div className="shrink-0">{media}</div>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="font-mono text-[0.9375rem] tracking-[0.06em] text-accent uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn('page-head-title', eyebrow && 'mt-1')}>{name}</h1>
        {shown.length ? (
          <p className="mt-2 text-[1.0625rem] leading-normal text-ink-soft">
            {shown.join(' · ')}
          </p>
        ) : null}
        {note ? (
          <p className="mt-3 max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-soft">{note}</p>
        ) : null}
        {actions ? <div className="mt-5 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  )
}

/** Skeleton with the same geometry as the header above. */
export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-7" aria-hidden>
      <span className="skeleton block h-24 w-24 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        <span className="skeleton block h-8 w-3/5" />
        <span className="skeleton block h-4 w-2/5" />
        <span className="skeleton block h-4 w-4/5" />
        <div className="flex gap-3 pt-2">
          <span className="skeleton block h-11 w-36 rounded-md" />
          <span className="skeleton block h-11 w-36 rounded-md" />
        </div>
      </div>
    </div>
  )
}
