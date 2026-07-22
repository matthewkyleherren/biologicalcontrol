import {cn} from '@/lib/cn'

export type PageHeaderProps = {
  title: string
  /** One short line. If it needs a paragraph, it belongs in an empty state. */
  subtitle?: string
  /** Primary action for the page, right-aligned on desktop. */
  action?: React.ReactNode
  className?: string
}

/**
 * The replacement for the old rail-title + 3rem display headline + three-line
 * manifesto that opened every page. Functional surfaces get a title, at most one
 * line of orientation, and the action that matters.
 */
export function PageHeader({title, subtitle, action, className}: PageHeaderProps) {
  return (
    <div className={cn('page-head', className)}>
      <div className="min-w-0">
        <h1 className="page-head-title">{title}</h1>
        {subtitle ? <p className="page-head-sub">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
