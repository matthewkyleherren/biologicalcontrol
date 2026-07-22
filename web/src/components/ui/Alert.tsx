import {cn} from '@/lib/cn'
import {Icon} from './Icon'

export type AlertProps = {
  tone?: 'error' | 'success' | 'info'
  children: React.ReactNode
  className?: string
}

/**
 * Errors state what happened and what to do next; they never blame the reader
 * and never carry an exclamation mark.
 */
export function Alert({tone = 'info', children, className}: AlertProps) {
  return (
    <div
      className={cn('alert', `alert--${tone}`, className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">
        <Icon name={tone === 'success' ? 'check' : 'alert'} size={18} />
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
