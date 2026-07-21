import Link from 'next/link'
import {ThemeSettings} from '@/components/ThemeSettings'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-paper-2">
      <div className="mx-auto flex max-w-[var(--site-max)] flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
        <div className="max-w-md">
          <p className="rail-title">biologicalcontrol.org</p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl tracking-[-0.03em] text-ink md:text-2xl">
            A community archive for everyone who was there — colleagues, partners, families —
            share a story from the compound and keep the memory warm.
          </p>
          <p className="theme-only theme-only-retro94 retro94-counter" aria-hidden>
            Visitors: 0048217
          </p>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-ink-soft">
          <Link href="/people" className="nav-link">
            People
          </Link>
          <Link href="/stories" className="nav-link">
            Stories
          </Link>
          <Link href="/galleries" className="nav-link">
            Photos
          </Link>
          <Link href="/programme" className="nav-link">
            Programme
          </Link>
          <Link href="/contribute" className="nav-link">
            Share a story
          </Link>
          <Link href="/join" className="nav-link">
            Join
          </Link>
          <ThemeSettings variant="link" />
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[var(--site-max)] flex-col gap-2 px-5 py-4 text-sm text-ink-faint md:flex-row md:justify-between md:px-8">
          <p>IITA Biological Control Programme · West Africa · 1979–1994</p>
          <p>Independent folklore archive · Not an official IITA publication</p>
        </div>
      </div>
    </footer>
  )
}
