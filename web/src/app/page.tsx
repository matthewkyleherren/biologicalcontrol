import Link from 'next/link'
import {Show} from '@clerk/nextjs'
import {client} from '@/sanity/client'
import {
  FEATURED_PEOPLE_QUERY,
  GALLERIES_QUERY,
  HOME_COUNTS_QUERY,
  LATEST_STORIES_QUERY,
  SETTINGS_QUERY,
} from '@/sanity/queries'
import {StoryCard} from '@/components/StoryCard'
import {PersonCard} from '@/components/PersonCard'
import {GalleryCard, type GalleryCover} from '@/components/galleries/GalleryCard'
import {fallbackHome} from '@/lib/fallback-content'
import type {GallerySummary, PersonSummary, StorySummary} from '@/lib/types'

export const revalidate = 60

type GalleryWithCover = GallerySummary & {cover?: GalleryCover}

export default async function HomePage() {
  const [settings, latest, people, galleries, counts] = await Promise.all([
    client.fetch(SETTINGS_QUERY).catch(() => null),
    client.fetch(LATEST_STORIES_QUERY).catch(() => [] as StorySummary[]),
    client.fetch(FEATURED_PEOPLE_QUERY).catch(() => [] as PersonSummary[]),
    client.fetch(GALLERIES_QUERY).catch(() => [] as GalleryWithCover[]),
    client.fetch(HOME_COUNTS_QUERY).catch(() => ({stories: 0, people: 0, galleries: 0})),
  ])

  const hasContent = (counts?.stories ?? 0) > 0
  const data = hasContent
    ? {
        settings,
        latest: latest as StorySummary[],
        people: people as PersonSummary[],
        galleries: galleries as GalleryWithCover[],
        counts,
      }
    : {...fallbackHome, galleries: fallbackHome.galleries as GalleryWithCover[]}

  const intro =
    data.settings?.intro ||
    'A gathering place for everyone who lived the IITA Biological Control Programme — staff, spouses, kids who grew up on station, national-programme friends — and a folklore archive of the messy, funny, affectionate stories that never made the annual report.'

  const recentStories: StorySummary[] = data.latest.slice(0, 4)

  return (
    <main>
      <Show when="signed-out">
        <section className="section-band">
          <div className="mx-auto grid max-w-[var(--site-max)] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-end md:gap-16 md:px-8 md:py-24">
            <div className="rise-in min-w-0">
              <p className="rail-title">IITA · West Africa · 1979–1994</p>
              <h1 className="story-title mt-5 max-w-[14ch] text-[2.5rem] text-ink sm:text-5xl md:text-[3.5rem] lg:text-[4rem]">
                Find each other. Leave a story.
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/people" className="btn-primary">
                  Who was there
                </Link>
                <Link href="/contribute" className="btn-secondary">
                  Share a story
                </Link>
              </div>
            </div>
            <div className="rise-in rise-in-delay-1 min-w-0 md:pb-2">
              <p className="max-w-[34rem] text-lg leading-relaxed text-ink-soft md:text-xl md:leading-relaxed">
                {intro}
              </p>
              <p className="mt-6">
                <Link
                  href="/programme"
                  className="text-base font-medium text-ink underline decoration-rule underline-offset-[0.18em] transition-colors hover:text-accent hover:decoration-accent"
                >
                  New here? Read the Programme intro →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </Show>

      <div className="section-band bg-paper-2">
        <div className="mx-auto flex max-w-[var(--site-max)] px-5 py-3.5 md:px-8">
          <p className="hero-meta">
            <span>
              <strong>{data.counts.stories}</strong> stories
            </span>
            <span>
              <strong>{data.counts.people}</strong> people
            </span>
            <span>
              <strong>{data.counts.galleries}</strong> galleries
            </span>
            <span>Families welcome</span>
          </p>
        </div>
      </div>

      <Show when="signed-in">
        <section className="section-band">
          <div className="mx-auto flex max-w-[var(--site-max)] flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-8">
            <p className="text-base font-medium text-ink">Welcome back.</p>
            <div className="flex flex-wrap items-center gap-1">
              <Link href="/chat" className="nav-link">
                Messages
              </Link>
              <Link href="/me" className="nav-link">
                Your profile
              </Link>
            </div>
          </div>
        </section>
      </Show>

      <section className="section-band">
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">Recently added</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">The newest stories</h2>
            </div>
            <Link href="/stories" className="nav-link shrink-0">
              See all →
            </Link>
          </div>
          <div className="mt-2">
            {recentStories.map((story) => (
              <StoryCard key={story._id} {...story} slug={story.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-band bg-paper-2">
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">Galleries</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">Recent photographs</h2>
            </div>
            <Link href="/galleries" className="nav-link shrink-0">
              All galleries →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.galleries.slice(0, 3).map((gallery) => (
              <GalleryCard
                key={gallery._id}
                slug={gallery.slug}
                title={gallery.title}
                year={gallery.year}
                location={gallery.location}
                photoCount={gallery.photoCount}
                cover={gallery.cover}
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-12 md:px-8 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">People</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">Who was there</h2>
              <p className="mt-2 max-w-[32rem] text-base text-ink-soft md:text-lg">
                Look up old colleagues, partners, and compound neighbours. Claim a profile —
                families welcome.
              </p>
            </div>
            <Link href="/people" className="nav-link shrink-0">
              All people →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.people.slice(0, 8).map((person) => (
              <PersonCard key={person._id} {...person} slug={person.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
