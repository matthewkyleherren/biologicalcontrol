'use client'

import Image from 'next/image'
import {useCallback, useEffect, useRef} from 'react'
import {Icon} from '@/components/ui'
import type {LightboxPhoto} from './photo-source'

export type LightboxProps = {
  photos: LightboxPhoto[]
  /** Index of the photo on the stage. The parent owns it so the grid can restore focus. */
  index: number
  galleryTitle: string
  onIndexChange: (index: number) => void
  onClose: () => void
}

/** Below this a horizontal drag is a wobble, not a swipe. */
const SWIPE_PX = 48

/**
 * A full-screen photo viewer built on the native `<dialog>`: `showModal()` gives
 * us the top layer, the focus trap, and Escape for free — all of which a
 * hand-rolled overlay gets wrong. It is mounted only while open, because
 * `.lightbox { display: flex }` would otherwise beat the UA's
 * `dialog:not([open]) { display: none }`.
 *
 * Controls are deliberately redundant: buttons, arrow keys, and swipe all do the
 * same three things, because this archive is read on phones by people who will
 * try whichever one they know.
 */
export function Lightbox({photos, index, galleryTitle, onIndexChange, onClose}: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const touchRef = useRef<{x: number; y: number} | null>(null)

  const total = photos.length
  const photo = photos[index]
  const hasPrev = index > 0
  const hasNext = index < total - 1

  // Open once on mount, hold the background still, and hand focus to the
  // control someone is most likely to want next.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!dialog.open) dialog.showModal()
    const first = nextRef.current?.disabled ? prevRef.current : nextRef.current
    first?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Escape and the close button both land here, so unmounting and focus
  // restoration have exactly one path.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  const step = useCallback(
    (delta: number) => {
      const target = index + delta
      if (target < 0 || target > total - 1) return
      onIndexChange(target)
    },
    [index, total, onIndexChange]
  )

  const dismiss = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      onIndexChange(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      onIndexChange(total - 1)
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0]
    touchRef.current = touch ? {x: touch.clientX, y: touch.clientY} : null
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchRef.current
    touchRef.current = null
    const touch = event.changedTouches[0]
    if (!start || !touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return

    step(dx < 0 ? 1 : -1)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={`Photographs from ${galleryTitle}`}
      onKeyDown={handleKeyDown}
      className="lightbox h-full max-h-none w-full max-w-none overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-3 pt-3">
        <p className="truncate-1 text-[1.0625rem] font-semibold text-paper">{galleryTitle}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close photo viewer"
          className="lightbox-btn shrink-0 cursor-pointer focus-visible:outline-paper! active:scale-95"
        >
          <Icon name="close" size={24} />
        </button>
      </div>

      <div
        className="lightbox-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(event) => {
          // Tapping the dark margin closes; tapping the photograph does not.
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        {photo ? (
          <Image
            key={photo.key}
            src={photo.fullSrc}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="100vw"
            priority
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        ) : null}
      </div>

      <div className="lightbox-bar">
        <button
          type="button"
          ref={prevRef}
          onClick={() => step(-1)}
          disabled={!hasPrev}
          aria-label="Previous photograph"
          className="lightbox-btn shrink-0 cursor-pointer focus-visible:outline-paper! active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <Icon name="back" size={24} />
        </button>

        <div className="min-w-0 flex-1 text-center">
          {photo?.caption ? (
            <p className="line-clamp-3 text-[1.0625rem] leading-snug text-paper [overflow-wrap:anywhere]">
              {photo.caption}
            </p>
          ) : null}
          <p className="mt-1 font-mono text-[0.9375rem] tabular-nums" aria-live="polite">
            {index + 1} of {total}
          </p>
        </div>

        <button
          type="button"
          ref={nextRef}
          onClick={() => step(1)}
          disabled={!hasNext}
          aria-label="Next photograph"
          className="lightbox-btn shrink-0 cursor-pointer focus-visible:outline-paper! active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <Icon name="forward" size={24} />
        </button>
      </div>
    </dialog>
  )
}
