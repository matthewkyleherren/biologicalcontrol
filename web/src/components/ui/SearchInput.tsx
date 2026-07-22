'use client'

import {useId} from 'react'
import {cn} from '@/lib/cn'
import {Icon} from './Icon'

export type SearchInputProps = {
  value: string
  onValueChange: (next: string) => void
  /** Visible-to-screen-readers label. Rendered as a real `<label>`, visually hidden. */
  label: string
  placeholder?: string
  className?: string
  autoFocus?: boolean
  /** Announced result count, wired to `aria-live` by the caller if needed. */
  id?: string
}

export function SearchInput({
  value,
  onValueChange,
  label,
  placeholder = 'Search…',
  className,
  autoFocus,
  id,
}: SearchInputProps) {
  const generated = useId()
  const inputId = id ?? generated

  return (
    <div className={cn('search', className)}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <span className="search-icon">
        <Icon name="search" size={18} />
      </span>
      <input
        id={inputId}
        type="search"
        className="input"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => onValueChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear search"
          onClick={() => onValueChange('')}
        >
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
  )
}
