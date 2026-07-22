/**
 * One icon set for the whole app — a small hand-rolled Feather-style family.
 *
 * Deliberately not a dependency: the set is tiny, the stroke weight matches
 * Geist's, and mixing icon libraries (or using emoji as icons) is the fastest
 * way to make an interface look assembled rather than designed.
 *
 * Icons are decorative by default (`aria-hidden`). Pass a `label` only when the
 * icon is the *only* content of a control and carries its accessible name.
 */

export type IconName =
  | 'home'
  | 'people'
  | 'stories'
  | 'photos'
  | 'messages'
  | 'search'
  | 'close'
  | 'back'
  | 'forward'
  | 'down'
  | 'plus'
  | 'send'
  | 'settings'
  | 'user'
  | 'signout'
  | 'edit'
  | 'camera'
  | 'check'
  | 'alert'
  | 'menu'
  | 'mail'
  | 'compose'

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c0-3.3 2.8-5.6 6.2-5.6s6.2 2.3 6.2 5.6" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4" />
      <path d="M18 14.8c2 .8 3.3 2.6 3.3 5.2" />
    </>
  ),
  stories: (
    <>
      <path d="M4 4.5h6a2.5 2.5 0 0 1 2 2.5v12a2 2 0 0 0-2-1.6H4Z" />
      <path d="M20 4.5h-6a2.5 2.5 0 0 0-2 2.5v12a2 2 0 0 1 2-1.6h6Z" />
    </>
  ),
  photos: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m3.5 17 4.8-4.4a2 2 0 0 1 2.7 0L17 18" />
      <path d="m14.5 14 1.8-1.6a2 2 0 0 1 2.7 0l1.5 1.4" />
    </>
  ),
  messages: (
    <>
      <path d="M20.5 12c0 4-3.8 7.2-8.5 7.2a10 10 0 0 1-2.6-.34L4.5 20.5l1.1-3.4A6.9 6.9 0 0 1 3.5 12c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  back: <path d="M15 4.5 7.5 12l7.5 7.5" />,
  forward: <path d="M9 4.5 16.5 12 9 19.5" />,
  down: <path d="m5 9 7 7 7-7" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 10.5 13.5" />
      <path d="M20.5 3.5 14 20.5l-3.5-7-7-3.5Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M19.4 13a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7.4 7.4 0 0 0-1.7-1L15 3h-6l-.5 2.9a7.4 7.4 0 0 0-1.7 1L4.5 6.4l-2 3.4 2 1.2a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7a7.4 7.4 0 0 0 1.7 1L9 21h6l.5-2.9a7.4 7.4 0 0 0 1.7-1l2.3.7 2-3.4-2-1.2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c0-3.8 3.4-6.4 7.5-6.4s7.5 2.6 7.5 6.4" />
    </>
  ),
  signout: (
    <>
      <path d="M14.5 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4" />
      <path d="M10 8.5 6 12l4 3.5" />
      <path d="M6 12h9.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.5-2.5h8l1.5 2.5h3v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.2v.2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 7 5.2a2 2 0 0 0 2.4 0l7-5.2" />
    </>
  ),
  compose: (
    <>
      <path d="M11 5.5H6A2.5 2.5 0 0 0 3.5 8v10A2.5 2.5 0 0 0 6 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-5" />
      <path d="M16.5 3.8a2.1 2.1 0 0 1 3 3L13 13.2l-3.6.8.8-3.6Z" />
    </>
  ),
}

export type IconProps = {
  name: IconName
  /** Pixel size; the icon is square. */
  size?: number
  /** Accessible name. Omit for decorative icons that sit beside a text label. */
  label?: string
  className?: string
  strokeWidth?: number
}

export function Icon({name, size = 20, label, className, strokeWidth = 1.75}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
