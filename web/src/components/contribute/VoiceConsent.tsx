'use client'

import {cn} from '@/lib/cn'

export function VoiceConsent({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex min-h-14 cursor-pointer items-start gap-3 border border-rule bg-surface p-4 text-base leading-relaxed text-ink',
        disabled && 'cursor-not-allowed opacity-55',
        className
      )}
    >
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 accent-accent"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span>
        I agree that biologicalcontrol.org may store this recording, use a machine to write it
        down, and let an editor listen before the story appears. I can choose later whether my
        voice itself is published.
      </span>
    </label>
  )
}
