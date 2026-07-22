import type {Metadata} from 'next'
import {client} from '@/sanity/client'
import {GALLERIES_QUERY} from '@/sanity/queries'
import {fallbackHome} from '@/lib/fallback-content'
import type {GallerySummary} from '@/lib/types'
import {ButtonLink, EmptyState, PageHeader} from '@/components/ui'
import {GalleryCard, type GalleryCover} from '@/components/galleries/GalleryCard'

export const metadata: Metadata = {
  title: 'Galleries',
  description:
    'Photographs from the Biological Control Programme community — fields, insectaries, compounds, and the people who shared them.',
}

export const revalidate = 60

/** `GALLERIES_QUERY` adds the first photograph and a real count to the summary. */
type GalleryListItem = GallerySummary & {cover?: GalleryCover}

export default async function GalleriesPage() {
  const galleries = (await client.fetch(GALLERIES_QUERY).catch(() => [])) as GalleryListItem[]
  const list: GalleryListItem[] = galleries.length ? galleries : fallbackHome.galleries

  return (
    <main className="container pb-14 md:pb-20">
      <PageHeader
        title="Photographs"
        subtitle="Field sites, insectaries, releases, and the compounds people lived in."
        action={
          <ButtonLink href="/contribute" variant="secondary" icon="camera">
            Share photos
          </ButtonLink>
        }
      />

      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {list.map((gallery) => (
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
      ) : (
        <EmptyState
          icon="photos"
          title="No galleries yet"
          action={
            <ButtonLink href="/contribute" icon="camera">
              Share photos
            </ButtonLink>
          }
        >
          A gallery gathers photographs from one place or one year — a field site, an insectary, a
          Saturday on the compound. Send yours and we will help name who is in the frame.
        </EmptyState>
      )}
    </main>
  )
}
