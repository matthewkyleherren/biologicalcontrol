'use client'

import Link from 'next/link'
import {cn} from '@/lib/cn'

export type TabItem<T extends string = string> = {
  id: T
  label: string
  count?: number
}

/** Client-side tab strip. Arrow keys move between tabs, as expected. */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  label,
  className,
}: {
  items: ReadonlyArray<TabItem<T>>
  value: T
  onValueChange: (next: T) => void
  label: string
  className?: string
}) {
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.id === value)
    if (index < 0) return
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    onValueChange(items[next].id)
  }

  return (
    <div role="tablist" aria-label={label} className={cn('tabs', className)} onKeyDown={onKeyDown}>
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            className="tab"
            onClick={() => onValueChange(item.id)}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className="font-mono text-[0.75rem] text-ink-faint">{item.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel<T extends string>({
  id,
  active,
  children,
}: {
  id: T
  active: boolean
  children: React.ReactNode
}) {
  if (!active) return null
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  )
}

/** Route-driven tab strip, for tabs that are real pages. */
export function LinkTabs({
  items,
  current,
  label,
  className,
}: {
  items: ReadonlyArray<{href: string; label: string}>
  current: string
  label: string
  className?: string
}) {
  return (
    <nav aria-label={label} className={cn('tabs', className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="tab"
          aria-current={item.href === current ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
