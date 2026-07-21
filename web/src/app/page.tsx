import Link from 'next/link'
import {client} from '@/sanity/client'
import {
  FEATURED_PEOPLE_QUERY,
  FEATURED_STORIES_QUERY,
  GALLERIES_QUERY,
  HOME_COUNTS_QUERY,
  LATEST_STORIES_QUERY,
  SETTINGS_QUERY,
} from '@/sanity/queries'
import {StoryCard} from '@/components/StoryCard'
import {PersonCard} from '@/components/PersonCard'
import {fallbackHome} from '@/lib/fallback-content'
import type {GallerySummary, PersonSummary, StorySummary} from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  const [settings, featured, latest, people, galleries, counts] = await Promise.all([
    client.fetch(SETTINGS_QUERY).catch(() => null),
    client.fetch(FEATURED_STORIES_QUERY).catch(() => [] as StorySummary[]),
    client.fetch(LATEST_STORIES_QUERY).catch(() => [] as StorySummary[]),
    client.fetch(FEATURED_PEOPLE_QUERY).catch(() => [] as PersonSummary[]),
    client.fetch(GALLERIES_QUERY).catch(() => [] as GallerySummary[]),
    client.fetch(HOME_COUNTS_QUERY).catch(() => ({stories: 0, people: 0, galleries: 0})),
  ])

  const hasContent = (counts?.stories ?? 0) > 0
  const data = hasContent
    ? {
        settings,
        featured: featured as StorySummary[],
        latest: latest as StorySummary[],
        people: people as PersonSummary[],
        galleries: galleries as GallerySummary[],
        counts,
      }
    : fallbackHome

  const intro =
    data.settings?.intro ||
    'A gathering place for everyone who lived the IITA Biological Control Programme — staff, spouses, kids who grew up on station, national-programme friends — and a folklore archive of the messy, funny, affectionate stories that never made the annual report.'

  const featuredStories: StorySummary[] = (
    data.featured.length ? data.featured : data.latest
  ).slice(0, 4)

  return (
    <main>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[var(--site-max)] gap-10 px-5 py-12 md:grid-cols-[1.3fr_0.7fr] md:px-8 md:py-20">
          <div className="rise-in min-w-0">
            <p className="rail-title">IITA · West Africa · 1979–1994</p>
            <h1 className="story-title mt-4 max-w-[22ch] text-[2.15rem] text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Find each other. Leave a story.
            </h1>
            <p className="mt-6 max-w-[36rem] text-xl leading-relaxed text-ink-soft md:text-[1.35rem]">
              {intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/people" className="btn-primary">
                Who was there
              </Link>
              <Link href="/contribute" className="btn-secondary">
                Share a story
              </Link>
            </div>
          </div>
          <aside className="rise-in rise-in-delay-1 self-end rounded-sm border border-rule bg-paper-2 p-5 md:p-6">
            <p className="rail-title">In the archive</p>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[
                {label: 'Stories', value: data.counts.stories},
                {label: 'People', value: data.counts.people},
                {label: 'Galleries', value: data.counts.galleries},
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-ink-faint">{item.label}</dt>
                  <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em] text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">
              Like folklore.org — but for the community that shared the compound: entomologists,
              technicians, pilots, national partners, spouses, and the kids who learned the
              insectary by smell. The science brought people together; the stories keep them
              findable.
            </p>
            <Link href="/programme" className="mt-4 inline-block text-base text-accent underline decoration-rule">
              New here? Read the Programme intro →
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-10 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">Featured</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">Stories worth retelling</h2>
            </div>
            <Link href="/stories" className="nav-link shrink-0">
              See all →
            </Link>
          </div>
          <div className="mt-2">
            {featuredStories.map((story) => (
              <StoryCard key={story._id} {...story} slug={story.slug} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-rule bg-paper-2">
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-10 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">People</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">Who was there</h2>
              <p className="mt-2 max-w-[32rem] text-base text-ink-soft md:text-lg">
                Look up old colleagues, partners, and compound neighbours. Claim a profile —
                families welcome. The cards are placeholders until the real stationery turns up.
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

      <section>
        <div className="mx-auto max-w-[var(--site-max)] px-5 py-10 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="rail-title">Galleries</p>
              <h2 className="story-title mt-2 text-2xl md:text-3xl">Photographs from the compound</h2>
            </div>
            <Link href="/galleries" className="nav-link shrink-0">
              All galleries →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.galleries.slice(0, 3).map((gallery) => (
              <Link
                key={gallery._id}
                href={`/galleries/${gallery.slug}`}
                className="group min-w-0 rounded-sm border border-rule bg-paper p-5 transition-colors hover:border-ink"
              >
                <p className="rail-title">
                  {[gallery.year, gallery.location].filter(Boolean).join(' · ') || 'Undated'}
                </p>
                <h3 className="story-title mt-2 text-xl group-hover:text-accent">{gallery.title}</h3>
                {gallery.description ? (
                  <p className="mt-3 line-clamp-3 text-base leading-relaxed text-ink-soft">
                    {gallery.description}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-ink-faint">
                  {gallery.photoCount ?? 0} photographs
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
