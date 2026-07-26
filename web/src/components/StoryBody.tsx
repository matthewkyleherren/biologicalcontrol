import {PortableText, type PortableTextComponents, type PortableTextBlock} from 'next-sanity'
import Image from 'next/image'
import {urlFor} from '@/sanity/image'

function blockText(value: PortableTextBlock | undefined): string {
  if (!value || !Array.isArray(value.children)) return ''
  return value.children
    .map((child) => ('text' in child && typeof child.text === 'string' ? child.text : ''))
    .join('')
}

function headingId(value: PortableTextBlock | undefined, fallback: string): string {
  if (value?._key) {
    return value._key.startsWith('h-') ? value._key : `h-${value._key}`
  }
  const text = blockText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return text ? `h-${text}` : fallback
}

const components: PortableTextComponents = {
  block: {
    h2: ({children, value}) => <h2 id={headingId(value, 'h-2')}>{children}</h2>,
    h3: ({children, value}) => <h3 id={headingId(value, 'h-3')}>{children}</h3>,
    h4: ({children, value}) => <h4 id={headingId(value, 'h-4')}>{children}</h4>,
  },
  types: {
    image: ({value}) => {
      if (!value?.asset) return null
      const src = urlFor(value).width(1400).url()
      return (
        <figure>
          <Image
            src={src}
            alt={value.alt || ''}
            width={1400}
            height={900}
            className="h-auto w-full"
          />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },
  },
  marks: {
    link: ({children, value}) => {
      const href = value?.href || '#'
      const rel = href.startsWith('http') ? 'noreferrer noopener' : undefined
      return (
        <a href={href} rel={rel}>
          {children}
        </a>
      )
    },
  },
}

export function StoryBody({value}: {value: unknown}) {
  if (!Array.isArray(value)) return null
  return (
    <div className="prose-ms">
      <PortableText value={value} components={components} />
    </div>
  )
}
