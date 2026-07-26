'use client'

import {useCallback, useEffect, useId, useRef, useState} from 'react'
import Link from 'next/link'
import {Icon} from '@/components/ui'
import {cn} from '@/lib/cn'
import type {StoryHeading} from '@/lib/story-headings'
import type {StoryNavItem} from './StoryNav'
import './story-reader.css'

export type StoryTocItem = {
  title: string
  slug: string
  year?: number | null
}

type StoryReaderProps = {
  title: string
  slug: string
  excerpt?: string | null
  wordCount: number
  authorName?: string | null
  authorHref?: string | null
  previous?: StoryNavItem | null
  next?: StoryNavItem | null
  headings: StoryHeading[]
  tocStories: StoryTocItem[]
  children: React.ReactNode
}

function groupStoriesByDecade(stories: StoryTocItem[]) {
  const groups = new Map<string, StoryTocItem[]>()
  const sorted = [...stories].sort((a, b) => {
    const ay = typeof a.year === 'number' ? a.year : Number.POSITIVE_INFINITY
    const by = typeof b.year === 'number' ? b.year : Number.POSITIVE_INFINITY
    if (ay !== by) return ay - by
    return a.title.localeCompare(b.title)
  })
  for (const story of sorted) {
    const year = story.year
    const label =
      typeof year === 'number' && Number.isFinite(year)
        ? `${Math.floor(year / 10) * 10}s`
        : 'Undated'
    const list = groups.get(label) || []
    list.push(story)
    groups.set(label, list)
  }
  return Array.from(groups.entries())
}

export function StoryReader({
  title,
  slug,
  excerpt,
  wordCount,
  authorName,
  authorHref,
  previous,
  next,
  headings,
  tocStories,
  children,
}: StoryReaderProps) {
  const articleRef = useRef<HTMLElement | null>(null)
  const [tocOpen, setTocOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState<string | null>(headings[0]?.id ?? null)
  const [headingOffsets, setHeadingOffsets] = useState<Array<{id: string; ratio: number}>>([])
  const tocTitleId = useId()

  const closeToc = useCallback(() => setTocOpen(false), [])
  const openToc = useCallback(() => setTocOpen(true), [])

  useEffect(() => {
    document.body.classList.toggle('story-toc-open', tocOpen)
    return () => document.body.classList.remove('story-toc-open')
  }, [tocOpen])

  useEffect(() => {
    if (!tocOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeToc()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tocOpen, closeToc])

  const measure = useCallback(() => {
    const article = articleRef.current
    if (!article) return

    const rect = article.getBoundingClientRect()
    const articleTop = window.scrollY + rect.top
    const articleHeight = Math.max(article.offsetHeight, 1)
    const viewport = window.innerHeight
    const readable = Math.max(articleHeight - viewport * 0.35, 1)
    const raw = (window.scrollY + viewport * 0.28 - articleTop) / readable
    setProgress(Math.min(1, Math.max(0, raw)))
    setScrolled(window.scrollY > 12)

    if (!headings.length) {
      setHeadingOffsets([])
      return
    }

    const offsets = headings
      .map((heading) => {
        const el = document.getElementById(heading.id)
        if (!el) return null
        const top = window.scrollY + el.getBoundingClientRect().top - articleTop
        return {id: heading.id, ratio: Math.min(1, Math.max(0, top / articleHeight))}
      })
      .filter(Boolean) as Array<{id: string; ratio: number}>

    setHeadingOffsets(offsets)

    const focusY = window.scrollY + viewport * 0.28
    let current = headings[0]?.id ?? null
    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (!el) continue
      const top = window.scrollY + el.getBoundingClientRect().top
      if (top <= focusY + 8) current = heading.id
    }
    setActiveHeading(current)
  }, [headings])

  useEffect(() => {
    measure()
    const onScroll = () => measure()
    const onResize = () => measure()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [measure])

  const scrubTo = (clientY: number, track: HTMLElement) => {
    const article = articleRef.current
    if (!article) return
    const trackRect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientY - trackRect.top) / trackRect.height))
    const articleTop = window.scrollY + article.getBoundingClientRect().top
    const articleHeight = article.offsetHeight
    const target = articleTop + ratio * articleHeight - window.innerHeight * 0.28
    window.scrollTo({top: Math.max(0, target), behavior: 'smooth'})
  }

  const decadeGroups = groupStoriesByDecade(tocStories)

  return (
    <div className="story-reader">
          <div className="story-reader-shell">
        <div
          className={cn('story-chrome', scrolled && 'is-scrolled')}
          role="navigation"
          aria-label="Story"
        >
          <div className="story-chrome-nav">
            <Link
              href={previous ? `/stories/${previous.slug}` : '#'}
              aria-disabled={!previous}
              className={cn('story-chrome-btn', !previous && 'pointer-events-none opacity-35')}
              aria-label={previous ? `Previous: ${previous.title}` : 'No previous story'}
              tabIndex={previous ? 0 : -1}
            >
              <Icon name="back" size={14} />
            </Link>
            <Link
              href={next ? `/stories/${next.slug}` : '#'}
              aria-disabled={!next}
              className={cn('story-chrome-btn', !next && 'pointer-events-none opacity-35')}
              aria-label={next ? `Next: ${next.title}` : 'No next story'}
              tabIndex={next ? 0 : -1}
            >
              <Icon name="forward" size={14} />
            </Link>
          </div>

          <div className="story-chrome-title min-w-0">
            <Icon name="stories" size={14} className="shrink-0 text-black/50" />
            <strong title={title}>{title}</strong>
          </div>

          <div className="story-chrome-actions">
            <Link
              href="/contribute"
              className="story-chrome-btn"
              aria-label="Share a story"
            >
              <Icon name="plus" size={16} />
            </Link>
            <button
              type="button"
              className="story-chrome-btn"
              aria-label="Open table of contents"
              aria-expanded={tocOpen}
              aria-controls={tocTitleId}
              onClick={openToc}
            >
              <Icon name="menu" size={16} />
            </button>
          </div>
        </div>

        <article ref={articleRef} className="story-paper">
          <header className="story-paper-header">
            <p className="story-meta">
              {wordCount.toLocaleString('en-US')} words
              {authorName ? (
                <>
                  <span className="story-meta-sep" aria-hidden>
                    |
                  </span>
                  {authorHref ? (
                    <Link href={authorHref}>{authorName}</Link>
                  ) : (
                    <span>{authorName}</span>
                  )}
                </>
              ) : null}
            </p>
            <h1 className="story-paper-title">{title}</h1>
            {excerpt ? <p className="story-paper-dek">{excerpt}</p> : null}
            <hr className="story-paper-rule" />
          </header>
          {children}
          <p className="story-end" aria-hidden>
            ╌╌ END ╌╌
          </p>
        </article>
      </div>

      <aside
        className={cn('story-ruler', 'is-ready')}
        aria-hidden={false}
        aria-label="Reading progress"
      >
        <div
          className="story-ruler-track"
          onClick={(event) => scrubTo(event.clientY, event.currentTarget)}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuetext={`${progress.toFixed(2)} through story`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            const article = articleRef.current
            if (!article) return
            const delta = event.key === 'ArrowDown' ? 0.05 : -0.05
            const nextProgress = Math.min(1, Math.max(0, progress + delta))
            const articleTop = window.scrollY + article.getBoundingClientRect().top
            const target =
              articleTop + nextProgress * article.offsetHeight - window.innerHeight * 0.28
            window.scrollTo({top: Math.max(0, target)})
          }}
        >
          <div className="story-ruler-line" />
          {headingOffsets.map((item) => {
            const heading = headings.find((h) => h.id === item.id)
            if (!heading) return null
            const active = activeHeading === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  className={cn('story-ruler-tick', active && 'is-active')}
                  style={{top: `${item.ratio * 100}%`}}
                  aria-label={heading.text}
                  onClick={(event) => {
                    event.stopPropagation()
                    document.getElementById(item.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                />
                <span
                  className={cn('story-ruler-label', active && 'is-active')}
                  style={{top: `${item.ratio * 100}%`}}
                >
                  {heading.text}
                </span>
              </div>
            )
          })}
          <div className="story-ruler-playhead" style={{top: `${progress * 100}%`}}>
            <span className="story-ruler-playhead-value">{progress.toFixed(2)}</span>
            <span className="story-ruler-playhead-mark" />
          </div>
        </div>
      </aside>

      <div
        className={cn('story-toc-backdrop', tocOpen && 'is-open')}
        onClick={closeToc}
        aria-hidden={!tocOpen}
      />
      <nav
        id={tocTitleId}
        className={cn('story-toc', tocOpen && 'is-open')}
        aria-label="Stories contents"
        aria-hidden={!tocOpen}
      >
        <div className="story-toc-head">
          <p className="story-toc-brand">Biological Control</p>
          <button type="button" className="story-chrome-btn" aria-label="Close contents" onClick={closeToc}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="story-toc-scroll">
          {decadeGroups.map(([decade, stories]) => (
            <section key={decade} className="story-toc-section">
              <h2 className="story-toc-section-title">{decade}</h2>
              <ul className="story-toc-list">
                {stories.map((story) => {
                  const active = story.slug === slug
                  return (
                    <li key={story.slug}>
                      <Link
                        href={`/stories/${story.slug}`}
                        className={cn('story-toc-link', active && 'is-active')}
                        aria-current={active ? 'page' : undefined}
                        onClick={closeToc}
                      >
                        {story.title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
        <div className="story-toc-foot">
          <Link href="/contribute" className="story-toc-cta" onClick={closeToc}>
            Share a story
          </Link>
        </div>
      </nav>
    </div>
  )
}
