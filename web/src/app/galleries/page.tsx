import type {Metadata} from 'next'
import Link from 'next/link'
import {client} from '@/sanity/client'
import {GALLERIES_QUERY} from '@/sanity/queries'
import {fallbackHome} from '@/lib/fallback-content'
import type {GallerySummary} from '@/lib/types'

export const metadata: Metadata = {
  title: 'Galleries',
  description:
    'Photographs from the Biological Control Programme community — fields, insectaries, compounds, and the people who shared them.',
}

export const revalidate = 60

export default async function GalleriesPage() {
  const galleries = (await client.fetch(GALLERIES_QUERY).catch(() => [])) as GallerySummary[]
  const list: GallerySummary[] = galleries.length ? galleries : fallbackHome.galleries

  return (
    <main className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="rail-title">Photographs</p>
          <h1 className="story-title mt-3 text-[2.15rem] sm:text-4xl md:text-5xl">Galleries</h1>
          <p className="mt-4 max-w-[36rem] text-xl leading-relaxed text-ink-soft">
            Field sites, insectaries, release flights, workshops, house parties — dig out the
            envelopes and name who is in the frame. Family albums count.
          </p>
        </div>
        <Link href="/contribute" className="btn-secondary shrink-0">
          Share photos
        </Link>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {list.map((gallery) => (
          <Link
            key={gallery._id}
            href={`/galleries/${gallery.slug}`}
            className="group min-w-0 rounded-sm border border-rule bg-paper p-6 transition-colors hover:border-ink"
          >
            <p className="rail-title">
              {[gallery.year, gallery.location].filter(Boolean).join(' · ') || 'Gallery'}
            </p>
            <h2 className="story-title mt-3 text-2xl group-hover:text-accent">{gallery.title}</h2>
            {gallery.description ? (
              <p className="mt-3 text-lg text-ink-soft">{gallery.description}</p>
            ) : null}
            <p className="mt-5 text-sm text-ink-faint">{gallery.photoCount ?? 0} photographs</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
