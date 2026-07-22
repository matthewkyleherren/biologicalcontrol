'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Icon} from '@/components/ui/Icon'
import {isActive, NAV_ITEMS} from './nav-items'
import {useUnread} from './UnreadProvider'

/**
 * Primary navigation on phones.
 *
 * The previous mobile nav was a horizontally-scrolling strip of text links —
 * destinations you had to discover by swiping. A fixed bottom bar with icons
 * *and* permanent labels is the pattern every phone app this audience already
 * uses; nothing is hidden and every target clears 44px.
 */
export function BottomTabs() {
  const pathname = usePathname()
  const {total} = useUnread()

  // The thread view owns the whole screen — its composer sits where the bar would.
  const inThread = /^\/chat\/[^/]+/.test(pathname)
  if (inThread) return null

  return (
    // `.tabbar` hides itself above 1024px in globals.css — a `lg:hidden`
    // utility here would lose to the component class's `display: grid`.
    <nav className="tabbar" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item)
        const showBadge = item.href === '/chat' && total > 0
        return (
          <Link
            key={item.href}
            href={item.href}
            className="tabbar-item"
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative inline-flex">
              <Icon name={item.icon} size={22} strokeWidth={active ? 2 : 1.6} />
              {showBadge ? (
                <span className="tabbar-pip" aria-hidden>
                  {total > 9 ? '9+' : total}
                </span>
              ) : null}
            </span>
            <span className="tabbar-label">{item.label}</span>
            {showBadge ? (
              <span className="sr-only">
                {total} unread {total === 1 ? 'message' : 'messages'}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
