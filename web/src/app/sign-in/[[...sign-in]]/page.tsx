import type {Metadata} from 'next'
import {SignIn} from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Sign in · biologicalcontrol.org',
}

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
        biologicalcontrol.org
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-lg leading-relaxed text-[var(--muted)]">
        Password, text me a code, or email link — pick what is easiest.
      </p>
      <div className="clerk-auth-shell [&_.cl-rootBox]:mx-auto [&_.cl-rootBox]:w-full">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-[var(--border)] bg-[var(--bg)]',
              headerTitle: 'text-2xl',
              headerSubtitle: 'text-lg text-[var(--muted)]',
              formButtonPrimary:
                'min-h-12 bg-[var(--fg)] text-[var(--bg)] text-lg hover:opacity-90',
              formFieldInput: 'min-h-12 text-lg',
              formFieldLabel: 'text-base',
              footerActionLink: 'text-base',
              identityPreviewText: 'text-base',
              otpCodeFieldInput: 'min-h-12 min-w-10 text-xl',
            },
          }}
        />
      </div>
    </main>
  )
}
