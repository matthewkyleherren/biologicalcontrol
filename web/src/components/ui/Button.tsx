'use client'

import Link from 'next/link'
import {cn} from '@/lib/cn'
import {Icon, type IconName} from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  /** Icon rendered before the label. */
  icon?: IconName
  /** Replaces the label with a spinner and blocks interaction. */
  loading?: boolean
  /** Stretches to the container width — the right default on mobile forms. */
  block?: boolean
  className?: string
  children?: React.ReactNode
}

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, 'className' | 'children'>

function classes({variant = 'primary', size = 'md', block, className}: CommonProps) {
  return cn(
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'w-full',
    className
  )
}

/**
 * All eight states are covered: default, hover, focus-visible, active, and
 * disabled come from CSS; loading, error and success are the caller's job to
 * express through `loading`, an adjacent `Alert`, and the label itself.
 */
export function Button({
  variant,
  size,
  icon,
  loading,
  block,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes({variant, size, block, className})}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden />
      ) : icon ? (
        <Icon name={icon} size={size === 'sm' ? 16 : 18} />
      ) : null}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  icon,
  block,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={classes({variant, size, block, className})}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children}
    </Link>
  )
}

/** Square icon-only control. `label` is required — it becomes the button name. */
export function IconButton({
  icon,
  label,
  className,
  ...rest
}: {icon: IconName; label: string} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children'
> & {className?: string}) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      title={label}
      className={cn('btn btn--icon', className)}
    >
      <Icon name={icon} size={20} />
    </button>
  )
}
