'use client'

import Link from 'next/link'
import {Show, SignInButton, UserButton} from '@clerk/nextjs'
import {ThemeSettings} from '@/components/ThemeSettings'

const links = [
  {href: '/people', label: 'People'},
  {href: '/stories', label: 'Stories'},
  {href: '/programme', label: 'Programme'},
  {href: '/galleries', label: 'Photos'},
]

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="theme-only theme-only-retro94 retro94-toolbar" aria-hidden>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Go</span>
        <span>Bookmarks</span>
        <span>Options</span>
        <span>Directory</span>
        <span>Window</span>
        <span>Help</span>
        <span className="ml-auto">Best viewed in Netscape 3.0</span>
      </div>
      <div className="theme-only theme-only-retro94 retro94-marquee" aria-hidden>
        <span className="retro94-marquee-track">
          ★★★ WELCOME TO BIOLOGICALCONTROL.ORG ★★★ You are visitor #0048217 ★★★ Site last updated:
          12 June 1994 ★★★ FREE hit counter ★★★ Under construction forever ★★★ Cassava mealybug
          defeated — click here!!! ★★★
        </span>
      </div>
      <div className="mx-auto flex max-w-[var(--site-max)] items-center justify-between gap-4 px-5 py-3.5 md:px-8 md:py-4">
        <Link href="/" className="site-wordmark min-w-0 truncate py-1">
          biologicalcontrol.org
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
            <Link href="/contribute" className="btn-primary ml-3">
              Share a story
            </Link>
          </nav>
          <Link href="/contribute" className="btn-primary shrink-0 lg:hidden">
            Share a story
          </Link>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="nav-link ml-1 min-h-10 px-3 text-base">
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="ml-2 flex items-center gap-1">
              <Link href="/me" className="nav-link hidden sm:inline-flex">
                Profile
              </Link>
              <UserButton />
            </div>
          </Show>
          <ThemeSettings variant="gear" />
        </div>
      </div>
      <div className="theme-only theme-only-retro94 px-5 md:px-8" aria-hidden>
        <p className="retro94-under-construction">
          <span className="retro94-uc-gif" />
          Under Construction — please excuse our dust (and Comic Sans)
        </p>
      </div>
      <div className="border-t border-rule lg:hidden">
        <nav
          className="mx-auto flex max-w-[var(--site-max)] gap-1 overflow-x-auto px-3 py-1 text-ink-soft [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Mobile"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link whitespace-nowrap px-3">
              {link.label}
            </Link>
          ))}
          <Link href="/join" className="nav-link whitespace-nowrap px-3">
            Join
          </Link>
          <Link href="/sign-in" className="nav-link whitespace-nowrap px-3">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
