/**
 * Extract heading anchors from Portable Text for the reading ruler / TOC.
 */

export type StoryHeading = {
  id: string
  text: string
  level: 2 | 3 | 4
}

type PortableSpan = {_type?: string; text?: string}
type PortableBlock = {
  _type?: string
  style?: string
  children?: PortableSpan[]
  _key?: string
}

function slugify(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return base ? `h-${base}` : `h-${index + 1}`
}

export function extractHeadings(value: unknown): StoryHeading[] {
  if (!Array.isArray(value)) return []
  const headings: StoryHeading[] = []
  const used = new Set<string>()

  ;(value as PortableBlock[]).forEach((block, index) => {
    if (block?._type !== 'block') return
    const style = block.style
    if (style !== 'h2' && style !== 'h3' && style !== 'h4') return
    const text = (block.children || []).map((c) => c?.text || '').join('').trim()
    if (!text) return
    let id = block._key ? `h-${block._key}` : slugify(text, index)
    if (used.has(id)) id = `${id}-${index}`
    used.add(id)
    headings.push({
      id,
      text,
      level: style === 'h2' ? 2 : style === 'h3' ? 3 : 4,
    })
  })

  return headings
}
