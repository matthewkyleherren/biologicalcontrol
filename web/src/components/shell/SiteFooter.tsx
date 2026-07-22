'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

const LINKS = [
  {href: '/programme', label: 'About the programme'},
  {href: '/contribute', label: 'Share a story'},
  {href: '/settings', label: 'Settings'},
]

/**
 * Quiet, single band. No link columns, no visitor counter, no theme switcher —
 * appearance settings moved to /settings where settings belong.
 */
export function SiteFooter() {
  const pathname = usePathname()

  // Messaging is a full-height surface; a footer under it would push the
  // composer off-screen on a phone.
  if (pathname.startsWith('/chat')) return null

  return (
    <footer className="mt-auto border-t border-rule">
      <div className="container flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
          <span className="site-wordmark mr-1.5 inline">biologicalcontrol.org</span>
          A community archive for everyone who was there.
        </p>
        <nav className="flex flex-wrap gap-x-1 gap-y-0.5" aria-label="Footer">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="header-link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-rule">
        <div className="container flex flex-col gap-1 py-3 text-[0.8rem] text-ink-faint md:flex-row md:justify-between">
          <p>IITA Biological Control Programme · West Africa · 1979–1994</p>
          <p>Independent folklore archive · Not an official IITA publication</p>
        </div>
      </div>
    </footer>
  )
}
