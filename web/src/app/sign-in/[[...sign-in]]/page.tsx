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
              formButtonPrimary:
                'min-h-12 bg-[var(--fg)] text-[var(--bg)] text-base hover:opacity-90',
              formFieldInput: 'min-h-12 text-base',
              footerActionLink: 'text-base',
            },
          }}
        />
      </div>
    </main>
  )
}
