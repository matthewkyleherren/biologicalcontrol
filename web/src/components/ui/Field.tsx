'use client'

import {useId} from 'react'
import {cn} from '@/lib/cn'

type FieldShellProps = {
  label: string
  /** Marked visibly rather than with a colour or an asterisk alone. */
  optional?: boolean
  help?: string
  error?: string | null
  className?: string
  children: (ids: {id: string; describedBy: string | undefined; invalid: boolean}) => React.ReactNode
}

/**
 * Label above the control, help below it, error replacing help.
 *
 * Placeholders are never used as labels — the audience reads slowly and a
 * placeholder disappears the moment they start typing.
 */
export function Field({label, optional, help, error, className, children}: FieldShellProps) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = error ? errorId : help ? helpId : undefined

  return (
    <div className={cn('field', className)}>
      <label className="field-label" htmlFor={id}>
        {label}
        {optional ? <span className="field-optional"> · optional</span> : null}
      </label>
      {children({id, describedBy, invalid: Boolean(error)})}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  )
}

type BaseProps = {
  label: string
  optional?: boolean
  help?: string
  error?: string | null
  className?: string
}

export function TextField({
  label,
  optional,
  help,
  error,
  className,
  ...rest
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'>) {
  return (
    <Field label={label} optional={optional} help={help} error={error} className={className}>
      {({id, describedBy, invalid}) => (
        <input
          {...rest}
          id={id}
          className="input"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
      )}
    </Field>
  )
}

export function TextAreaField({
  label,
  optional,
  help,
  error,
  className,
  ...rest
}: BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'>) {
  return (
    <Field label={label} optional={optional} help={help} error={error} className={className}>
      {({id, describedBy, invalid}) => (
        <textarea
          rows={6}
          {...rest}
          id={id}
          className="textarea"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
      )}
    </Field>
  )
}

export function SelectField({
  label,
  optional,
  help,
  error,
  className,
  children,
  ...rest
}: BaseProps & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'>) {
  return (
    <Field label={label} optional={optional} help={help} error={error} className={className}>
      {({id, describedBy, invalid}) => (
        <select
          {...rest}
          id={id}
          className="select"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        >
          {children}
        </select>
      )}
    </Field>
  )
}
