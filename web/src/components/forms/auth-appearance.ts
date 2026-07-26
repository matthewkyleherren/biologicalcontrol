import type {ComponentProps} from 'react'
import type {SignIn} from '@clerk/nextjs'

/**
 * Shared Clerk `appearance` override for /sign-in and /sign-up.
 *
 * Enlarges inputs, buttons and OTP fields for an older, phone-first audience
 * and points every colour at the locked design tokens instead of Clerk's
 * default indigo theme. Import this in both auth pages so they can never
 * drift apart.
 */
export const authAppearance: NonNullable<ComponentProps<typeof SignIn>['appearance']> = {
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none rounded-sm border border-rule bg-surface',
    headerTitle: 'font-serif text-2xl font-normal tracking-tight text-ink',
    headerSubtitle: 'text-base text-ink-soft',
    formButtonPrimary:
      'min-h-12 rounded-sm bg-ink font-mono text-xs uppercase tracking-[0.08em] text-white hover:bg-accent',
    formFieldInput: 'min-h-12 rounded-sm text-lg border-rule text-ink',
    formFieldLabel: 'font-mono text-xs uppercase tracking-[0.08em] text-ink',
    footerActionLink: 'text-base text-accent',
    identityPreviewText: 'text-base text-ink',
    otpCodeFieldInput: 'min-h-12 min-w-10 rounded-sm text-xl border-rule text-ink',
  },
}
