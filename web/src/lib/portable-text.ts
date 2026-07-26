/**
 * Lightweight Portable Text helpers for the story reader (word count, plain text).
 */

type PortableSpan = {
  _type?: string
  text?: string
  marks?: string[]
}

type PortableBlock = {
  _type?: string
  style?: string
  children?: PortableSpan[]
  alt?: string
  caption?: string
}

export function portableTextToPlain(value: unknown): string {
  if (!Array.isArray(value)) return ''
  const parts: string[] = []
  for (const block of value as PortableBlock[]) {
    if (block?._type === 'block' && Array.isArray(block.children)) {
      parts.push(block.children.map((c) => c?.text || '').join(''))
    } else if (block?._type === 'image') {
      const caption = [block.alt, block.caption].filter(Boolean).join(' ')
      if (caption) parts.push(caption)
    }
  }
  return parts.join('\n\n')
}

export function countWords(value: unknown): number {
  const text = portableTextToPlain(value).trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}
