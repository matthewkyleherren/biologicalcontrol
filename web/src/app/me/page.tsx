import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {MeClient} from './MeClient'

export const metadata: Metadata = {
  title: 'Your profile',
}

export default async function MePage() {
  const session = await auth()
  if (!session.userId) {
    redirect('/sign-in?redirect_url=/me')
  }

  const people = await client.fetch(PEOPLE_QUERY)
  return <MeClient people={people ?? []} />
}
