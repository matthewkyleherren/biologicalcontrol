/** Shared content shapes for Sanity fetches and fallbacks. */

export type StorySummary = {
  _id: string
  title: string
  slug: string
  excerpt?: string | null
  year?: number | null
  location?: string | null
  narrator?: {name?: string; slug?: string} | null
  mainImage?: {alt?: string} | null
  featured?: boolean
}

export type PersonSummary = {
  _id: string
  name: string
  slug: string
  role?: string | null
  yearsActive?: string | null
  location?: string | null
  portrait?: {alt?: string} | null
}

export type GallerySummary = {
  _id: string
  title: string
  slug: string
  description?: string | null
  year?: number | null
  location?: string | null
  photoCount?: number | null
}

export type ProgrammeContent = {
  title: string
  lede?: string | null
  body?: unknown[] | null
  timeline?: Array<{year: string; title: string; detail?: string}> | null
}

/** Deterministic inventory-style code for business-card placeholders. */
export function inventoryCode(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  const num = (hash % 9000) + 1000
  return `BCP-${num}`
}
