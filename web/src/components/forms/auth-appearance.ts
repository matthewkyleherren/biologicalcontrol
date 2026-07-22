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
    card: 'shadow-none border border-rule bg-paper',
    headerTitle: 'text-2xl text-ink',
    headerSubtitle: 'text-lg text-ink-soft',
    formButtonPrimary: 'min-h-12 bg-ink text-paper text-lg hover:opacity-90',
    formFieldInput: 'min-h-12 text-lg border-rule text-ink',
    formFieldLabel: 'text-base text-ink',
    footerActionLink: 'text-base text-accent',
    identityPreviewText: 'text-base text-ink',
    otpCodeFieldInput: 'min-h-12 min-w-10 text-xl border-rule text-ink',
  },
}
