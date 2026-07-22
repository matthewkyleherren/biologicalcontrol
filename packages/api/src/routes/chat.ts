import {and, desc, eq, inArray} from 'drizzle-orm'
import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {
  conversationMembers,
  conversations,
  messageAttachments,
  messages,
} from '@biologicalcontrol/db'
import {createMessageBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'

const createDmBody = z.object({
  peerUserId: z.string().uuid(),
})

const createGroupBody = z.object({
  title: z.string().min(1).max(200),
  memberUserIds: z.array(z.string().uuid()).max(50).default([]),
  compoundLabel: z.string().max(120).optional(),
})

export function chatRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

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
    return c.json({conversations: rows})
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

    const myMemberships = await db.query.conversationMembers.findMany({
      where: eq(conversationMembers.userId, user.id),
    })
    for (const membership of myMemberships) {
      const convo = await db.query.conversations.findFirst({
        where: eq(conversations.id, membership.conversationId),
      })
      if (!convo || convo.type !== 'dm') continue
      const peer = await db.query.conversationMembers.findFirst({
        where: and(
          eq(conversationMembers.conversationId, convo.id),
          eq(conversationMembers.userId, body.peerUserId)
        ),
      })
      if (peer) return c.json({conversation: convo})
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

    return c.json({conversation: convo}, 201)
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

    return c.json({conversation: convo}, 201)
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
      where: eq(messages.conversationId, conversationId),
      orderBy: [desc(messages.createdAt)],
      limit: 100,
    })

    return c.json({messages: rows.reverse()})
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
    if (existing) return c.json({message: existing})

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

    // TODO: Ably publish to conversation:{id} when ABLY_API_KEY is set
    return c.json({message}, 201)
  })

  return app
}
