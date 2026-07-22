/**
 * Time formatting for the community app.
 *
 * The audience is older and often reading on a phone, so every format favours
 * plain words over compact notation: "3 minutes ago", not "3m". Absolute times
 * are always available as a `title` so hovering (or a screen reader) gets the
 * exact moment.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function startOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** "Just now" · "5 minutes ago" · "Yesterday" · "14 March" · "March 1987" */
export function relativeTime(value: string | number | Date, now: Date = new Date()): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''

  const diff = now.getTime() - date.getTime()
  if (diff < 0) return 'Just now'
  if (diff < MINUTE) return 'Just now'

  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE)
    return mins === 1 ? '1 minute ago' : `${mins} minutes ago`
  }

  const dayDelta = Math.round((startOfDay(now) - startOfDay(date)) / DAY)

  if (dayDelta === 0) {
    const hours = Math.floor(diff / HOUR)
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (dayDelta === 1) return 'Yesterday'
  if (dayDelta < 7) return `${dayDelta} days ago`

  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : {year: 'numeric'}),
  })
}

/**
 * Compact form for a conversation list, where the row has no room for a
 * sentence: "14:32" today, "Yesterday", "Tue", then a date.
 */
export function listTime(value: string | number | Date, now: Date = new Date()): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''

  const dayDelta = Math.round((startOfDay(now) - startOfDay(date)) / DAY)

  if (dayDelta === 0) {
    return date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})
  }
  if (dayDelta === 1) return 'Yesterday'
  if (dayDelta < 7) return date.toLocaleDateString('en-GB', {weekday: 'short'})

  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : {year: '2-digit'}),
  })
}

/** Day separator inside a message transcript. */
export function dayLabel(value: string | number | Date, now: Date = new Date()): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''

  const dayDelta = Math.round((startOfDay(now) - startOfDay(date)) / DAY)
  if (dayDelta === 0) return 'Today'
  if (dayDelta === 1) return 'Yesterday'

  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : {year: 'numeric'}),
  })
}

/** "14:32" — the time a single message was sent. */
export function clockTime(value: string | number | Date): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})
}

/** Full absolute timestamp, for `title` attributes and screen readers. */
export function absoluteTime(value: string | number | Date): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** True when two messages should be visually grouped under one sender heading. */
export function withinGroupWindow(
  a: string | number | Date,
  b: string | number | Date,
  windowMs = 5 * MINUTE
): boolean {
  const t1 = toDate(a).getTime()
  const t2 = toDate(b).getTime()
  if (Number.isNaN(t1) || Number.isNaN(t2)) return false
  return Math.abs(t2 - t1) < windowMs
}

/** True when two timestamps fall on different calendar days. */
export function isNewDay(prev: string | number | Date, next: string | number | Date): boolean {
  return startOfDay(toDate(prev)) !== startOfDay(toDate(next))
}
