import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {toRoster} from '@/components/profile/roster'
import {SettingsClient} from './SettingsClient'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session.userId) {
    redirect('/sign-in?redirect_url=/settings')
  }

  // The whole roster is small enough to filter in the browser, which keeps the
  // "this is me" search instant and works without a search endpoint.
  const people = await client.fetch(PEOPLE_QUERY).catch(() => [])

  return <SettingsClient roster={toRoster(people)} />
}
