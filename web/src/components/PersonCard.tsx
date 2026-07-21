import Link from 'next/link'
import Image from 'next/image'
import {urlFor} from '@/sanity/image'
import {inventoryCode} from '@/lib/types'

type PersonCardProps = {
  name: string
  slug: string
  role?: string | null
  yearsActive?: string | null
  location?: string | null
  portrait?: {alt?: string} | null
}

export function PersonCard({name, slug, role, yearsActive, location, portrait}: PersonCardProps) {
  const imageUrl = portrait ? urlFor(portrait).width(240).height(240).url() : null
  const code = inventoryCode(slug)
  const station = location || 'Station TBD'

  return (
    <Link href={`/people/${slug}`} className="biz-card group block min-w-0">
      <div className="biz-card-inner">
        <div className="biz-card-stamp" aria-hidden>
          IITA
        </div>
        <div className="flex items-start justify-between gap-3">
          <p className="biz-card-inv">{code}</p>
          <p className="biz-card-org">Biol. Control · IITA</p>
        </div>
        <hr className="biz-card-rule" />
        <div className="mt-4 flex gap-4">
          <div className="biz-card-photo shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={(portrait as {alt?: string})?.alt || name}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="biz-card-initial">{name.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="biz-card-name group-hover:text-accent">{name}</h3>
            <p className="biz-card-role">{role || 'Programme member'}</p>
            <dl className="biz-card-meta">
              <div>
                <dt>Station</dt>
                <dd>{station}</dd>
              </div>
              {yearsActive ? (
                <div>
                  <dt>Years</dt>
                  <dd>{yearsActive}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
        <p className="biz-card-foot">Open profile →</p>
      </div>
    </Link>
  )
}
