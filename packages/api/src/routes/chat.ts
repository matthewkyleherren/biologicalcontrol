import {and, count, desc, eq, gt, ilike, inArray, isNull, ne} from 'drizzle-orm'
import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {
  conversationMembers,
  conversations,
  messageAttachments,
  messages,
  profiles,
  users,
} from '@biologicalcontrol/db'
import {createMessageBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {createAblyTokenRequest, publishConversationMessage} from '../services/ably'

const createDmBody = z.object({
  peerUserId: z.string().uuid(),
})

const createGroupBody = z.object({
  title: z.string().min(1).max(200),
  memberUserIds: z.array(z.string().uuid()).max(50).default([]),
  compoundLabel: z.string().max(120).optional(),
})

async function enrichConversation(db: Database, convo: typeof conversations.$inferSelect, viewerId: string) {
  const members = await db.query.conversationMembers.findMany({
    where: eq(conversationMembers.conversationId, convo.id),
  })
  const memberUsers = await db.query.users.findMany({
    where: inArray(
      users.id,
      members.map((m) => m.userId)
    ),
  })
  const byId = Object.fromEntries(memberUsers.map((u) => [u.id, u]))
  const peers = members
    .filter((m) => m.userId !== viewerId)
    .map((m) => ({
      id: m.userId,
      displayName: byId[m.userId]?.displayName ?? 'Friend',
    }))

  const latest = await db.query.messages.findFirst({
    where: eq(messages.conversationId, convo.id),
    orderBy: [desc(messages.createdAt)],
  })

  // Unread = messages from someone else since this member last opened the
  // thread. `lastReadAt` was already being written on every message fetch; it
  // just was never read back, so the inbox had no way to show unread state.
  const viewerMembership = members.find((m) => m.userId === viewerId)
  const unreadFilters = [
    eq(messages.conversationId, convo.id),
    isNull(messages.deletedAt),
    ne(messages.senderId, viewerId),
  ]
  if (viewerMembership?.lastReadAt) {
    unreadFilters.push(gt(messages.createdAt, viewerMembership.lastReadAt))
  }
  const [unread] = await db
    .select({value: count()})
    .from(messages)
    .where(and(...unreadFilters))

  const title =
    convo.title ||
    (convo.type === 'dm'
      ? peers.map((p) => p.displayName).join(', ') || 'Direct message'
      : 'Group')

  return {
    ...convo,
    title,
    peers,
    memberCount: members.length,
    unreadCount: unread?.value ?? 0,
    lastMessage: latest
      ? {
          id: latest.id,
          body: latest.body,
          senderId: latest.senderId,
          senderName: byId[latest.senderId]?.displayName ?? null,
          createdAt: latest.createdAt,
        }
      : null,
  }
}

export function chatRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.get('/chat/token', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const memberships = await db.query.conversationMembers.findMany({
      where: eq(conversationMembers.userId, user.id),
    })
    const tokenRequest = await createAblyTokenRequest(
      c.get('env'),
      user.id,
      memberships.map((m) => m.conversationId)
    )
    if (!tokenRequest) {
      return c.json({error: 'Realtime not configured', mode: 'poll'}, 200)
    }
    return c.json({tokenRequest, clientId: user.id})
  })

  app.get('/users/search', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const q = (c.req.query('q') ?? '').trim()

    const rows = q
      ? await db.query.users.findMany({
          where: and(ne(users.id, user.id), ilike(users.displayName, `%${q}%`)),
          limit: 30,
        })
      : await db.query.users.findMany({
          where: ne(users.id, user.id),
          orderBy: [desc(users.updatedAt)],
          limit: 30,
        })

    // "How connected" is the one line that tells you which Ade this is.
    // Without it the search results are an undifferentiated list of names.
    const connections =
      rows.length > 0
        ? await db.query.profiles.findMany({
            where: inArray(
              profiles.userId,
              rows.map((u) => u.id)
            ),
          })
        : []
    const howConnectedById = Object.fromEntries(
      connections.map((p) => [p.userId, p.howConnected])
    )

    return c.json({
      users: rows.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        howConnected: howConnectedById[u.id] ?? null,
      })),
    })
  })

  app.get('/conversations', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const memberships = await db.query.conversationMembers.findMany({
      where: eq(conversationMembers.userId, user.id),
    })
    const ids = memberships.map((m) => m.conversationId)
    if (!ids.length) return c.json({conversations: []})

    const rows = await db.query.conversations.findMany({
      where: inArray(conversations.id, ids),
      orderBy: [desc(conversations.updatedAt)],
    })
    const enriched = await Promise.all(rows.map((row) => enrichConversation(db, row, user.id)))
    return c.json({conversations: enriched})
  })

  app.post('/conversations/dm', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createDmBody.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)
    if (body.peerUserId === user.id) {
      return c.json({error: 'Cannot DM yourself'}, 400)
    }

    const peer = await db.query.users.findFirst({
      where: eq(users.id, body.peerUserId),
    })
    if (!peer) return c.json({error: 'Person not found'}, 404)

    const myMemberships = await db.query.conversationMembers.findMany({
      where: eq(conversationMembers.userId, user.id),
    })
    for (const membership of myMemberships) {
      const convo = await db.query.conversations.findFirst({
        where: eq(conversations.id, membership.conversationId),
      })
      if (!convo || convo.type !== 'dm') continue
      const peerMem = await db.query.conversationMembers.findFirst({
        where: and(
          eq(conversationMembers.conversationId, convo.id),
          eq(conversationMembers.userId, body.peerUserId)
        ),
      })
      if (peerMem) {
        const enriched = await enrichConversation(db, convo, user.id)
        return c.json({conversation: enriched})
      }
    }

    const [convo] = await db
      .insert(conversations)
      .values({
        type: 'dm',
        createdBy: user.id,
      })
      .returning()

    await db.insert(conversationMembers).values([
      {conversationId: convo!.id, userId: user.id, role: 'admin'},
      {conversationId: convo!.id, userId: body.peerUserId, role: 'member'},
    ])

    const enriched = await enrichConversation(db, convo!, user.id)
    return c.json({conversation: enriched}, 201)
  })

  app.post('/conversations/group', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createGroupBody.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)

    const [convo] = await db
      .insert(conversations)
      .values({
        type: 'group',
        title: body.title,
        compoundLabel: body.compoundLabel,
        createdBy: user.id,
      })
      .returning()

    const memberIds = Array.from(new Set([user.id, ...body.memberUserIds]))
    await db.insert(conversationMembers).values(
      memberIds.map((id) => ({
        conversationId: convo!.id,
        userId: id,
        role: id === user.id ? ('admin' as const) : ('member' as const),
      }))
    )

    const enriched = await enrichConversation(db, convo!, user.id)
    return c.json({conversation: enriched}, 201)
  })

  app.get('/conversations/:id', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const conversationId = c.req.param('id')
    const membership = await db.query.conversationMembers.findFirst({
      where: and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, user.id)
      ),
    })
    if (!membership) return c.json({error: 'Not found'}, 404)

    const convo = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })
    if (!convo) return c.json({error: 'Not found'}, 404)

    return c.json({conversation: await enrichConversation(db, convo, user.id)})
  })

  app.get('/conversations/:id/messages', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const conversationId = c.req.param('id')
    const membership = await db.query.conversationMembers.findFirst({
      where: and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, user.id)
      ),
    })
    if (!membership) return c.json({error: 'Not found'}, 404)

    const rows = await db.query.messages.findMany({
      where: and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt)),
      orderBy: [desc(messages.createdAt)],
      limit: 100,
    })

    const visible = rows.reverse()

    const senderIds = Array.from(new Set(visible.map((m) => m.senderId)))
    const senders =
      senderIds.length > 0
        ? await db.query.users.findMany({where: inArray(users.id, senderIds)})
        : []
    const senderNames = Object.fromEntries(senders.map((s) => [s.id, s.displayName]))

    await db
      .update(conversationMembers)
      .set({lastReadAt: new Date(), updatedAt: new Date()})
      .where(eq(conversationMembers.id, membership.id))

    return c.json({
      messages: visible.map((m) => ({
        ...m,
        senderName: senderNames[m.senderId] ?? 'Friend',
      })),
    })
  })

  app.post('/conversations/:id/messages', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createMessageBodySchema.parse(await c.req.json())
    if (!body.body && !body.attachmentR2Key) {
      return c.json({error: 'Message needs text or an attachment'}, 400)
    }

    const user = await ensureAppUser(db, auth)
    const conversationId = c.req.param('id')
    const membership = await db.query.conversationMembers.findFirst({
      where: and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, user.id)
      ),
    })
    if (!membership) return c.json({error: 'Not found'}, 404)

    const existing = await db.query.messages.findFirst({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.clientId, body.clientId)
      ),
    })
    if (existing) {
      return c.json({
        message: {...existing, senderName: user.displayName},
      })
    }

    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        body: body.body,
        clientId: body.clientId,
      })
      .returning()

    if (body.attachmentR2Key) {
      await db.insert(messageAttachments).values({
        messageId: message!.id,
        r2Key: body.attachmentR2Key,
        mime: body.attachmentMime ?? 'application/octet-stream',
        kind: 'image',
      })
    }

    await db
      .update(conversations)
      .set({updatedAt: new Date()})
      .where(eq(conversations.id, conversationId))

    const payload = {
      ...message!,
      senderName: user.displayName,
    }

    await publishConversationMessage(c.get('env'), conversationId, payload)

    return c.json({message: payload}, 201)
  })

  return app
}
