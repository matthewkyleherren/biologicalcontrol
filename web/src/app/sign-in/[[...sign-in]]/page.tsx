import type {Metadata} from 'next'
import {SignIn} from '@clerk/nextjs'
import {AuthShell} from '@/components/forms/AuthShell'
import {authAppearance} from '@/components/forms/auth-appearance'

export const metadata: Metadata = {
  title: 'Sign in · biologicalcontrol.org',
}

export default function SignInPage() {
  return (
    <AuthShell reassurance="Password, a text code, or an email link — whichever is easiest.">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        appearance={authAppearance}
      />
    </AuthShell>
  )
}
