import {cn} from '@/lib/cn'

/** A single shimmering block. Match the shape of the content it stands in for. */
export function Skeleton({className}: {className?: string}) {
  return <span className={cn('skeleton block', className)} aria-hidden />
}

/** Placeholder rows for a list of people or conversations. */
export function SkeletonRows({rows = 5, className}: {rows?: number; className?: string}) {
  return (
    <div className={cn('divide-y divide-rule', className)} aria-hidden>
      {Array.from({length: rows}).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Wrap a skeleton in this so screen readers hear one honest status message
 * instead of a field of empty boxes.
 */
export function LoadingRegion({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
