'use client'

import Link from 'next/link'
import {useEffect, useId, useRef, useState} from 'react'
import {cn} from '@/lib/cn'
import {Icon, type IconName} from './Icon'

export type MenuProps = {
  /** The control that opens the menu. Receives no props — style it yourself. */
  trigger: React.ReactNode
  /** Accessible name for the trigger button. */
  label: string
  children: React.ReactNode
  className?: string
}

/**
 * A small dropdown for the account menu. Closes on Escape, on outside click, and
 * on any activation inside it; returns focus to the trigger so keyboard users
 * are never dropped at the top of the document.
 */
export function Menu({trigger, label, children, className}: MenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        className="focus-ring inline-flex items-center rounded-full"
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          className="menu-panel"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function MenuLink({
  href,
  icon,
  children,
}: {
  href: string
  icon?: IconName
  children: React.ReactNode
}) {
  return (
    <Link href={href} role="menuitem" className="menu-item">
      {icon ? <Icon name={icon} size={18} className="text-ink-faint" /> : null}
      {children}
    </Link>
  )
}

export function MenuButton({
  icon,
  onClick,
  children,
}: {
  icon?: IconName
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" role="menuitem" className="menu-item" onClick={onClick}>
      {icon ? <Icon name={icon} size={18} className="text-ink-faint" /> : null}
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="menu-sep" role="separator" />
}
