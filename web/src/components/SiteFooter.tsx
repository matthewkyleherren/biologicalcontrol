import Link from 'next/link'
import {ThemeSettings} from '@/components/ThemeSettings'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-paper">
      <div className="mx-auto flex max-w-[var(--site-max)] flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8">
        <p className="max-w-xl text-base leading-relaxed text-ink-soft md:text-[1.05rem]">
          <span className="site-wordmark mr-2 inline text-[1.05rem]">biologicalcontrol.org</span>
          A community archive for everyone who was there — share a story from the compound.
        </p>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-ink-soft">
          <Link href="/people" className="nav-link">
            People
          </Link>
          <Link href="/stories" className="nav-link">
            Stories
          </Link>
          <Link href="/contribute" className="nav-link">
            Share a story
          </Link>
          <ThemeSettings variant="link" />
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[var(--site-max)] flex-col gap-1 px-5 py-3 text-xs text-ink-faint md:flex-row md:justify-between md:px-8">
          <p>IITA Biological Control Programme · West Africa · 1979–1994</p>
          <p>Independent folklore archive · Not an official IITA publication</p>
        </div>
      </div>
      <p className="theme-only theme-only-retro94 retro94-counter px-5 pb-4 md:px-8" aria-hidden>
        Visitors: 0048217
      </p>
    </footer>
  )
}
