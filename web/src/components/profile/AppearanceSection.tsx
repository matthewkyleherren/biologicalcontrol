'use client'

import {THEME_OPTIONS} from '@/lib/themes'
import {useTheme} from '@/components/ThemeProvider'

/**
 * The theme switcher, re-homed from the header gear into `/settings`.
 *
 * Same `useTheme()` hook and same `.theme-option` styling as the old dialog —
 * this is the settings-page rendering of it, not a second implementation of the
 * theme state. Choice is saved in this browser only, which the copy says.
 */
export function AppearanceSection() {
  const {theme, setTheme} = useTheme()

  return (
    <fieldset className="theme-fieldset mt-5">
      <legend className="sr-only">Site appearance</legend>
      {THEME_OPTIONS.map((option) => {
        const checked = theme === option.id
        return (
          <label key={option.id} className={`theme-option${checked ? ' is-active' : ''}`}>
            <input
              type="radio"
              name="site-theme"
              value={option.id}
              checked={checked}
              onChange={() => setTheme(option.id)}
            />
            <span className="theme-option-text">
              <span className="theme-option-label">{option.label}</span>
              <span className="theme-option-desc">{option.description}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
