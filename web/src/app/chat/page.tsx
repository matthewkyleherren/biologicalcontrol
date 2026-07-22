import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {ChatInbox} from './ChatInbox'

export const metadata: Metadata = {
  title: 'Messages',
}

export default async function ChatPage() {
  const session = await auth()
  if (!session.userId) redirect('/sign-in?redirect_url=/chat')
  return <ChatInbox />
}
