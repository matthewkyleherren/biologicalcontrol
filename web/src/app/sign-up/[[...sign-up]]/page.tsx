import type {Metadata} from 'next'
import {SignUp} from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Join · biologicalcontrol.org',
}

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
        biologicalcontrol.org
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">Create an account</h1>
      <p className="text-lg leading-relaxed text-[var(--muted)]">
        Welcome — use a password or a phone code. Someone can help on the same
        phone.
      </p>
      <div className="clerk-auth-shell [&_.cl-rootBox]:mx-auto [&_.cl-rootBox]:w-full">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
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
