/**
 * The app's component vocabulary. Import from here, not from the individual
 * files — one import site makes it obvious when a page reaches for a one-off
 * Tailwind chain instead of a shared primitive.
 *
 * See docs/ux-redesign.md for the rules these components encode.
 */

export {Alert} from './Alert'
export type {AlertProps} from './Alert'

export {Avatar, AvatarStack, initialsFrom} from './Avatar'
export type {AvatarProps, AvatarSize} from './Avatar'

export {Button, ButtonLink, IconButton} from './Button'
export type {ButtonProps, ButtonLinkProps} from './Button'

export {EmptyState} from './EmptyState'
export type {EmptyStateProps} from './EmptyState'

export {Field, TextField, TextAreaField, SelectField} from './Field'

export {Icon} from './Icon'
export type {IconName, IconProps} from './Icon'

export {Menu, MenuLink, MenuButton, MenuSeparator} from './Menu'
export type {MenuProps} from './Menu'

export {PageHeader} from './PageHeader'
export type {PageHeaderProps} from './PageHeader'

export {SearchInput} from './SearchInput'
export type {SearchInputProps} from './SearchInput'

export {Skeleton, SkeletonRows, LoadingRegion} from './Skeleton'

export {Tabs, TabPanel, LinkTabs} from './Tabs'
export type {TabItem} from './Tabs'
