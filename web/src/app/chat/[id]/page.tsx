import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import {ChatThread} from './ChatThread'

export const metadata: Metadata = {
  title: 'Conversation',
}

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{id: string}>
}) {
  const session = await auth()
  if (!session.userId) redirect('/sign-in?redirect_url=/chat')
  const {id} = await params
  return <ChatThread conversationId={id} />
}
