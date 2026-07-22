import type {Metadata} from 'next'
import {auth} from '@clerk/nextjs/server'
import {redirect} from 'next/navigation'
import type {DirectoryEntry} from '@/components/chat/types'
import {client} from '@/sanity/client'
import {PEOPLE_QUERY} from '@/sanity/queries'
import {ChatThread} from './ChatThread'

export const metadata: Metadata = {
  title: 'Conversation',
}

/**
 * The API has no link between an app account and a Sanity person record, so the
 * thread header resolves a profile the only honest way available: an exact
 * name match against the published directory. No match, no link — never a
 * guessed one.
 */
async function loadDirectory(): Promise<DirectoryEntry[]> {
  const people = (await client.fetch(PEOPLE_QUERY).catch(() => [])) as Array<{
    name?: string | null
    slug?: string | null
  }>
  return people
    .filter((p): p is {name: string; slug: string} => Boolean(p?.name && p?.slug))
    .map((p) => ({name: p.name, slug: p.slug}))
}

export default async function ChatThreadPage({params}: {params: Promise<{id: string}>}) {
  const session = await auth()
  if (!session.userId) redirect('/sign-in?redirect_url=/chat')
  const {id} = await params
  const directory = await loadDirectory()
  return <ChatThread conversationId={id} directory={directory} />
}
