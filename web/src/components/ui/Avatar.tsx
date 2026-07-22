import {cn} from '@/lib/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  name?: string | null
  /** Absolute image URL. Falls back to initials when absent. */
  src?: string | null
  size?: AvatarSize
  /** Hairline ring — use when the avatar sits on a tinted surface. */
  ring?: boolean
  className?: string
}

/**
 * Initials avatar with an optional photo.
 *
 * Most members have no picture: the database has an `avatar_r2_key` column that
 * nothing writes to yet, so initials are the honest default rather than a stock
 * silhouette. Initials sit on paper-3 with soft ink — deliberately quiet, so a
 * wall of them in the directory reads as texture, not as noise.
 */
export function initialsFrom(name?: string | null): string {
  if (!name) return '·'
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w))
  if (!words.length) return '·'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function Avatar({name, src, size = 'md', ring = false, className}: AvatarProps) {
  const initials = initialsFrom(name)

  return (
    <span
      className={cn('avatar', `avatar--${size}`, ring && 'avatar--ring', className)}
      aria-hidden={!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar sources are
        // remote and arbitrary; the loader config would need every host allow-listed.
        <img src={src} alt={name ? `${name}` : ''} loading="lazy" decoding="async" />
      ) : (
        initials
      )}
    </span>
  )
}

/** Overlapping avatars for group conversations. Shows at most three. */
export function AvatarStack({
  people,
  size = 'sm',
}: {
  people: Array<{id?: string; displayName?: string | null; avatarUrl?: string | null}>
  size?: AvatarSize
}) {
  const shown = people.slice(0, 3)
  return (
    <span className="avatar-stack">
      {shown.map((p, i) => (
        <Avatar key={p.id ?? i} name={p.displayName} src={p.avatarUrl} size={size} />
      ))}
    </span>
  )
}
