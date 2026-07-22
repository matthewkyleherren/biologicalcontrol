import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {toRoster} from '@/components/profile/roster'
import {MeClient} from './MeClient'

export const metadata: Metadata = {
  title: 'Your profile',
}

export default async function MePage() {
  const session = await auth()
  if (!session.userId) {
    redirect('/sign-in?redirect_url=/me')
  }

  // The roster resolves an approved claim's Sanity id into a name, portrait and
  // slug. Sanity can be empty in some environments — the profile still renders.
  const people = await client.fetch(PEOPLE_QUERY).catch(() => [])

  return <MeClient roster={toRoster(people)} />
}
