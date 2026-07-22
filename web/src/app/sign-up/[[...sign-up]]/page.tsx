import type {Metadata} from 'next'
import {SignUp} from '@clerk/nextjs'
import {AuthShell} from '@/components/forms/AuthShell'
import {authAppearance} from '@/components/forms/auth-appearance'

export const metadata: Metadata = {
  title: 'Join · biologicalcontrol.org',
}

export default function SignUpPage() {
  return (
    <AuthShell reassurance="Use a password or a phone code. Someone can help you from the same phone.">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
        appearance={authAppearance}
      />
    </AuthShell>
  )
}
