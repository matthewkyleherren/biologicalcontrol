'use client'

import Image from 'next/image'
import {useCallback, useRef, useState} from 'react'
import {Lightbox} from './Lightbox'
import type {LightboxPhoto} from './photo-source'

export type GalleryPhotosProps = {
  photos: LightboxPhoto[]
  galleryTitle: string
}

/**
 * The square grid, plus the viewer it opens. Tiles are real buttons, so Enter
 * and Space open a photograph without any keyboard handling of our own, and the
 * focus ring is the one every other control on the site uses.
 */
export function GalleryPhotos({photos, galleryTitle}: GalleryPhotosProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const openedFrom = useRef<number | null>(null)
  const tiles = useRef<Array<HTMLButtonElement | null>>([])

  const open = (index: number) => {
    openedFrom.current = index
    setOpenIndex(index)
  }

  const close = useCallback(() => {
    const origin = openedFrom.current
    openedFrom.current = null
    setOpenIndex(null)
    // The dialog is unmounting this tick; wait for the DOM before moving focus.
    if (origin !== null) {
      requestAnimationFrame(() => tiles.current[origin]?.focus())
    }
  }, [])

  return (
    <>
      <ul className="photo-grid">
        {photos.map((photo, index) => (
          <li key={photo.key} className="min-w-0">
            <button
              type="button"
              ref={(element) => {
                tiles.current[index] = element
              }}
              onClick={() => open(index)}
              aria-haspopup="dialog"
              className="photo-tile w-full cursor-pointer"
            >
              <Image
                src={photo.thumbSrc}
                alt={photo.alt}
                width={600}
                height={600}
                sizes="(max-width: 360px) 90vw, (max-width: 767px) 50vw, 240px"
                className="max-w-full"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null ? (
        <Lightbox
          photos={photos}
          index={openIndex}
          galleryTitle={galleryTitle}
          onIndexChange={setOpenIndex}
          onClose={close}
        />
      ) : null}
    </>
  )
}
