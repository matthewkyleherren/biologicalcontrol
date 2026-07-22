import type {IconName} from '@/components/ui/Icon'

export type NavItem = {
  href: string
  label: string
  icon: IconName
  /** Additional path prefixes that should light this item up. */
  match?: string[]
}

/**
 * One list drives both the desktop header and the mobile tab bar, so the two
 * can never drift apart. Five destinations is the ceiling — a sixth would make
 * the tab bar labels illegible at 320px.
 */
export const NAV_ITEMS: NavItem[] = [
  {href: '/', label: 'Home', icon: 'home'},
  {href: '/people', label: 'People', icon: 'people'},
  {href: '/stories', label: 'Stories', icon: 'stories'},
  {href: '/galleries', label: 'Photos', icon: 'photos'},
  {href: '/chat', label: 'Messages', icon: 'messages'},
]

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/'
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true
  return (item.match ?? []).some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
