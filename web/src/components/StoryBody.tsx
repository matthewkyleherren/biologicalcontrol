import {PortableText, type PortableTextComponents} from 'next-sanity'
import Image from 'next/image'
import {urlFor} from '@/sanity/image'

const components: PortableTextComponents = {
  types: {
    image: ({value}) => {
      if (!value?.asset) return null
      const src = urlFor(value).width(1400).url()
      return (
        <figure className="my-10">
          <Image
            src={src}
            alt={value.alt || ''}
            width={1400}
            height={900}
            className="h-auto w-full rounded-sm"
          />
          {value.caption ? (
            <figcaption className="mt-3 text-sm text-ink-faint">{value.caption}</figcaption>
          ) : null}
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
    <div className="prose-story">
      <PortableText value={value} components={components} />
    </div>
  )
}
