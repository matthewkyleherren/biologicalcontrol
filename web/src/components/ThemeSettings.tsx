'use client'

import {useEffect, useId, useRef, useState} from 'react'
import {THEME_OPTIONS, type ThemeId} from '@/lib/themes'
import {useTheme} from '@/components/ThemeProvider'

type ThemeSettingsProps = {
  variant?: 'gear' | 'link'
}

export function ThemeSettings({variant = 'gear'}: ThemeSettingsProps) {
  const {theme, setTheme} = useTheme()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  function pick(next: ThemeId) {
    setTheme(next)
  }

  return (
    <>
      {variant === 'gear' ? (
        <button
          type="button"
          className="theme-gear tap-target"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Open settings"
          onClick={() => setOpen(true)}
        >
          <GearIcon />
        </button>
      ) : (
        <button type="button" className="nav-link theme-settings-link" onClick={() => setOpen(true)}>
          Settings
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="theme-dialog"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false)
        }}
      >
        <div className="theme-dialog-panel">
          <div className="theme-dialog-head">
            <h2 id={titleId} className="theme-dialog-title">
              Settings
            </h2>
            <button
              type="button"
              className="theme-dialog-close tap-target"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <p className="theme-dialog-lead">Site appearance</p>
          <fieldset className="theme-fieldset">
            <legend className="sr-only">Theme</legend>
            {THEME_OPTIONS.map((option) => {
              const checked = theme === option.id
              return (
                <label
                  key={option.id}
                  className={`theme-option${checked ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="site-theme"
                    value={option.id}
                    checked={checked}
                    onChange={() => pick(option.id)}
                  />
                  <span className="theme-option-text">
                    <span className="theme-option-label">{option.label}</span>
                    <span className="theme-option-desc">{option.description}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        </div>
      </dialog>
    </>
  )
}

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 13a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7.4 7.4 0 0 0-1.7-1L15 3h-6l-.5 2.9a7.4 7.4 0 0 0-1.7 1L4.5 6.4l-2 3.4 2 1.2a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7a7.4 7.4 0 0 0 1.7 1L9 21h6l.5-2.9a7.4 7.4 0 0 0 1.7-1l2.3.7 2-3.4-2-1.2Z" />
    </svg>
  )
}
