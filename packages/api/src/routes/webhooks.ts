import {eq} from 'drizzle-orm'
import {Hono} from 'hono'
import {Webhooks} from 'svix'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {profiles, storyPersonTags, users} from '@biologicalcontrol/db'
import type {AppEnv} from '../middleware/auth'

const clerkUserWebhook = z.object({
  type: z.string(),
  data: z
    .object({
      id: z.string(),
      email_addresses: z
        .array(z.object({email_address: z.string()}))
        .optional(),
      phone_numbers: z
        .array(z.object({phone_number: z.string()}))
        .optional(),
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
    })
    .passthrough(),
})

const sanityStoryWebhook = z.object({
  _id: z.string(),
  _type: z.literal('story').optional(),
  people: z
    .array(z.object({_ref: z.string().optional(), _id: z.string().optional()}))
    .optional(),
})

export function webhooksRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.post('/webhooks/clerk', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const env = c.get('env')
    const rawBody = await c.req.text()

    if (env.CLERK_WEBHOOK_SECRET) {
      const wh = new Webhooks(env.CLERK_WEBHOOK_SECRET)
      try {
        wh.verify(rawBody, {
          'svix-id': c.req.header('svix-id') ?? '',
          'svix-timestamp': c.req.header('svix-timestamp') ?? '',
          'svix-signature': c.req.header('svix-signature') ?? '',
        })
      } catch {
        return c.json({error: 'Invalid webhook signature'}, 400)
      }
    } else {
      console.warn('[webhooks/clerk] CLERK_WEBHOOK_SECRET unset — accepting unsigned payload')
    }

    const payload = clerkUserWebhook.parse(JSON.parse(rawBody))
    if (!payload.type.startsWith('user.')) {
      return c.json({ok: true, ignored: true})
    }

    const email = payload.data.email_addresses?.[0]?.email_address ?? null
    const phone = payload.data.phone_numbers?.[0]?.phone_number ?? null
    const displayName =
      [payload.data.first_name, payload.data.last_name].filter(Boolean).join(' ').trim() ||
      'Friend'

    const existing = await db.query.users.findFirst({
      where: eq(users.clerkUserId, payload.data.id),
    })

    if (existing) {
      await db
        .update(users)
        .set({
          email,
          phoneE164: phone,
          displayName: displayName || existing.displayName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
    } else {
      const [created] = await db
        .insert(users)
        .values({
          clerkUserId: payload.data.id,
          email,
          phoneE164: phone,
          displayName,
          role: 'community',
        })
        .returning()
      await db.insert(profiles).values({userId: created!.id})
    }

    return c.json({ok: true})
  })

  app.post('/webhooks/sanity', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const payload = sanityStoryWebhook.parse(await c.req.json())
    const personIds = (payload.people ?? [])
      .map((p) => p._ref ?? p._id)
      .filter((id): id is string => Boolean(id))

    for (const sanityPersonId of personIds) {
      await db
        .insert(storyPersonTags)
        .values({
          sanityStoryId: payload._id,
          sanityPersonId,
          source: 'studio',
        })
        .onConflictDoNothing()
    }

    return c.json({ok: true, mirrored: personIds.length})
  })

  return app
}
