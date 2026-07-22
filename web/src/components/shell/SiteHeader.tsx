'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Show} from '@clerk/nextjs'
import {ButtonLink} from '@/components/ui/Button'
import {AccountMenu} from './AccountMenu'
import {isActive, NAV_ITEMS} from './nav-items'
import {useUnread} from './UnreadProvider'

/**
 * One bar, one row, one account control.
 *
 * The header it replaces carried nine separate targets — five nav links, a CTA,
 * a sign-in button, a profile link, a Clerk user button and a settings gear —
 * plus an inline 1994-theme marquee. On desktop this keeps the links; on mobile
 * it keeps only the wordmark and the account menu, because navigation lives in
 * the bottom tab bar where a thumb can reach it.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const {total} = useUnread()

  // The thread view supplies its own header (back arrow, who you're talking to).
  if (/^\/chat\/[^/]+/.test(pathname)) return null

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="site-wordmark focus-ring shrink-0 truncate">
          biologicalcontrol<span className="text-ink-faint">.org</span>
        </Link>

        <nav className="ml-4 hidden min-w-0 items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV_ITEMS.filter((item) => item.href !== '/').map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="header-link"
              aria-current={isActive(pathname, item) ? 'page' : undefined}
            >
              {item.label}
              {item.href === '/chat' && total > 0 ? (
                <span className="badge ml-2" aria-label={`${total} unread`}>
                  {total > 99 ? '99+' : total}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Show when="signed-in">
            <ButtonLink
              href="/contribute"
              variant="primary"
              size="sm"
              icon="compose"
              className="hidden sm:inline-flex"
            >
              Share a story
            </ButtonLink>
          </Show>
          <Show when="signed-out">
            <ButtonLink href="/join" variant="primary" size="sm" className="hidden sm:inline-flex">
              Join
            </ButtonLink>
          </Show>
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
