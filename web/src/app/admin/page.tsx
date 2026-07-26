import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {toRoster} from '@/components/profile/roster'
import {AdminClient} from './AdminClient'

export const metadata: Metadata = {
  title: 'Admin',
}

export default async function AdminPage() {
  const session = await auth()
  if (!session.userId) {
    redirect('/sign-in?redirect_url=/admin')
  }

  const people = await client.fetch(PEOPLE_QUERY).catch(() => [])

  return <AdminClient roster={toRoster(people)} />
}
