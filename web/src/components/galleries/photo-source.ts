import type {SanityImageSource} from '@sanity/image-url'
import {urlFor} from '@/sanity/image'

/** A photo as it comes back from `GALLERY_QUERY` — `photos[]{...}`. */
export type SanityPhoto = {
  _key?: string | null
  alt?: string | null
  caption?: string | null
  asset?: {_ref?: string | null} | null
}

/**
 * A photo flattened for the client: every URL is built on the server so the
 * grid and the lightbox never need the Sanity client in the browser bundle.
 */
export type LightboxPhoto = {
  key: string
  /** Square, hotspot-aware crop for the grid tile. */
  thumbSrc: string
  /** Long-edge-capped original for the lightbox stage. */
  fullSrc: string
  width: number
  height: number
  /** Never empty — see `describe()`. */
  alt: string
  caption: string | null
}

const MAX_EDGE = 1600
const THUMB_EDGE = 600

/**
 * Sanity encodes an asset's pixel size in its `_ref`
 * (`image-<hash>-2000x1500-jpg`), which is the only place `GALLERY_QUERY` gives
 * us dimensions. next/image needs them to reserve space before the load.
 */
function fullDimensions(ref?: string | null): {width: number; height: number} {
  const match = ref ? /-(\d+)x(\d+)-[a-z0-9]+$/i.exec(ref) : null
  const natural = match ? {w: Number(match[1]), h: Number(match[2])} : null

  if (!natural || !natural.w || !natural.h) {
    return {width: MAX_EDGE, height: Math.round(MAX_EDGE * 0.75)}
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(natural.w, natural.h))
  return {width: Math.round(natural.w * scale), height: Math.round(natural.h * scale)}
}

/**
 * Alt text, in order of honesty: the editor's alt, then the caption, then a
 * plain statement of what the file is. Never "image", never empty — someone
 * reading this page with a screen reader is looking for people they knew.
 */
function describe(photo: SanityPhoto, index: number, total: number, galleryTitle: string): string {
  const alt = photo.alt?.trim()
  if (alt) return alt

  const caption = photo.caption?.trim()
  if (caption) return caption

  return `Photograph ${index + 1} of ${total} from ${galleryTitle}`
}

export function toLightboxPhotos(
  photos: SanityPhoto[] | null | undefined,
  galleryTitle: string
): LightboxPhoto[] {
  const list = (photos ?? []).filter((photo) => Boolean(photo?.asset?._ref))

  return list.map((photo, index) => {
    const source = photo as unknown as SanityImageSource
    const {width, height} = fullDimensions(photo.asset?._ref)

    return {
      key: photo._key || `photo-${index}`,
      thumbSrc: urlFor(source).width(THUMB_EDGE).height(THUMB_EDGE).fit('crop').auto('format').url(),
      fullSrc: urlFor(source).width(width).height(height).fit('max').auto('format').url(),
      width,
      height,
      alt: describe(photo, index, list.length, galleryTitle),
      caption: photo.caption?.trim() || null,
    }
  })
}
