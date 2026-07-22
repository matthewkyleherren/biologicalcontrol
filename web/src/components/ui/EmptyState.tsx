import {cn} from '@/lib/cn'
import {Icon, type IconName} from './Icon'

export type EmptyStateProps = {
  icon?: IconName
  /** One line naming what is empty: "No messages yet". */
  title: string
  /** One line on why the space matters and what fills it. */
  children?: React.ReactNode
  /** The action that resolves the emptiness. */
  action?: React.ReactNode
  className?: string
}

/**
 * Empty states carry the explanation that used to live in each page's opening
 * manifesto paragraph — it belongs here, where someone is actually stuck.
 */
export function EmptyState({icon, title, children, action, className}: EmptyStateProps) {
  return (
    <div className={cn('empty', className)}>
      {icon ? (
        <span className="empty-icon">
          <Icon name={icon} size={32} strokeWidth={1.4} />
        </span>
      ) : null}
      <p className="empty-title">{title}</p>
      {children ? <p className="empty-text">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
