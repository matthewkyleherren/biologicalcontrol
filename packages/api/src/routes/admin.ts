import {and, count, desc, eq, gte} from 'drizzle-orm'
import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {
  personClaims,
  profiles,
  siteEvents,
  users,
  voiceStoryDrafts,
} from '@biologicalcontrol/db'
import {UserRole} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {sanityQuery} from '../services/sanity-query'

const roleBodySchema = z.object({
  role: UserRole,
})

const eventBodySchema = z.object({
  type: z.enum(['page_view', 'login']),
  path: z.string().max(500).optional(),
})

async function requireAdmin(db: Database, c: Parameters<typeof requireAuth>[0]) {
  const auth = requireAuth(c)
  if (!auth) return {error: c.json({error: 'Sign in required'}, 401)} as const
  const user = await ensureAppUser(db, auth)
  if (user.role !== 'admin') {
    return {error: c.json({error: 'Admin role required'}, 403)} as const
  }
  return {user} as const
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
}

export function adminRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  /** Public-ish beacon — auth optional. */
  app.post('/admin/events', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)
    const body = eventBodySchema.parse(await c.req.json())
    const auth = requireAuth(c)
    let userId: string | null = null
    if (auth) {
      const user = await ensureAppUser(db, auth)
      userId = user.id
      await db
        .update(users)
        .set({lastSeenAt: new Date(), updatedAt: new Date()})
        .where(eq(users.id, user.id))
    }

    await db.insert(siteEvents).values({
      type: body.type,
      path: body.path,
      userId,
    })
    return c.json({ok: true}, 201)
  })

  app.get('/admin/overview', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)
    const gate = await requireAdmin(db, c)
    if ('error' in gate) return gate.error

    const week = daysAgo(7)
    const month = daysAgo(30)

    const [memberCount] = await db.select({value: count()}).from(users)
    const [newWeek] = await db
      .select({value: count()})
      .from(users)
      .where(gte(users.createdAt, week))
    const [newMonth] = await db
      .select({value: count()})
      .from(users)
      .where(gte(users.createdAt, month))
    const [seenWeek] = await db
      .select({value: count()})
      .from(users)
      .where(gte(users.lastSeenAt, week))
    const [pendingClaims] = await db
      .select({value: count()})
      .from(personClaims)
      .where(eq(personClaims.status, 'pending'))
    const [voiceSubmitted] = await db
      .select({value: count()})
      .from(voiceStoryDrafts)
      .where(eq(voiceStoryDrafts.status, 'submitted'))
    const [pageViewsWeek] = await db
      .select({value: count()})
      .from(siteEvents)
      .where(and(eq(siteEvents.type, 'page_view'), gte(siteEvents.createdAt, week)))
    const [pageViewsMonth] = await db
      .select({value: count()})
      .from(siteEvents)
      .where(and(eq(siteEvents.type, 'page_view'), gte(siteEvents.createdAt, month)))
    const [loginsWeek] = await db
      .select({value: count()})
      .from(siteEvents)
      .where(and(eq(siteEvents.type, 'login'), gte(siteEvents.createdAt, week)))

    const pendingStories = await sanityQuery<number>(
      c.get('env'),
      `count(*[_type == "story" && reviewStatus == "pending"])`
    )
    const approvedStories = await sanityQuery<number>(
      c.get('env'),
      `count(*[_type == "story" && (!defined(reviewStatus) || reviewStatus == "approved")])`
    )

    return c.json({
      members: {
        total: memberCount?.value ?? 0,
        newLast7Days: newWeek?.value ?? 0,
        newLast30Days: newMonth?.value ?? 0,
        activeLast7Days: seenWeek?.value ?? 0,
      },
      queue: {
        pendingClaims: pendingClaims?.value ?? 0,
        pendingStories: pendingStories.ok ? pendingStories.result : null,
        voiceDraftsSubmitted: voiceSubmitted?.value ?? 0,
      },
      archive: {
        publicStories: approvedStories.ok ? approvedStories.result : null,
      },
      traffic: {
        pageViewsLast7Days: pageViewsWeek?.value ?? 0,
        pageViewsLast30Days: pageViewsMonth?.value ?? 0,
        loginsLast7Days: loginsWeek?.value ?? 0,
        note: 'Page views and logins count events recorded by this app since the tracker shipped. Vercel Analytics may show a longer history.',
      },
    })
  })

  app.get('/admin/users', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)
    const gate = await requireAdmin(db, c)
    if ('error' in gate) return gate.error

    const rows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
        locale: users.locale,
        createdAt: users.createdAt,
        lastSeenAt: users.lastSeenAt,
        howConnected: profiles.howConnected,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .orderBy(desc(users.createdAt))
      .limit(200)

    return c.json({
      users: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
      })),
    })
  })

  app.patch('/admin/users/:id/role', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)
    const gate = await requireAdmin(db, c)
    if ('error' in gate) return gate.error

    const body = roleBodySchema.parse(await c.req.json())
    const targetId = c.req.param('id')

    if (targetId === gate.user.id && body.role !== 'admin') {
      return c.json({error: 'You cannot remove your own admin role'}, 400)
    }

    const [updated] = await db
      .update(users)
      .set({role: body.role, updatedAt: new Date()})
      .where(eq(users.id, targetId))
      .returning()

    if (!updated) return c.json({error: 'Not found'}, 404)

    return c.json({
      user: {
        id: updated.id,
        displayName: updated.displayName,
        role: updated.role,
      },
    })
  })

  app.get('/admin/claims', async (c) => {
    if (!db) return c.json({error: 'Database not configured'}, 503)
    const gate = await requireAdmin(db, c)
    if ('error' in gate) return gate.error

    const status = c.req.query('status') || 'pending'
    const base = db
      .select({
        id: personClaims.id,
        userId: personClaims.userId,
        sanityPersonId: personClaims.sanityPersonId,
        status: personClaims.status,
        note: personClaims.note,
        createdAt: personClaims.createdAt,
        displayName: users.displayName,
        email: users.email,
      })
      .from(personClaims)
      .innerJoin(users, eq(users.id, personClaims.userId))
      .$dynamic()

    const rows =
      status === 'all'
        ? await base.orderBy(desc(personClaims.createdAt)).limit(100)
        : await base
            .where(
              eq(
                personClaims.status,
                status as 'pending' | 'approved' | 'rejected' | 'revoked'
              )
            )
            .orderBy(desc(personClaims.createdAt))
            .limit(100)

    const personIds = [...new Set(rows.map((row) => row.sanityPersonId))]
    const people =
      personIds.length > 0
        ? await sanityQuery<Array<{_id: string; name: string | null; slug: string | null}>>(
            c.get('env'),
            `*[_type == "person" && _id in $ids]{_id, name, "slug": slug.current}`,
            {ids: personIds}
          )
        : ({ok: true, result: []} as const)
    const byId = new Map(
      (people.ok ? people.result : []).map((person) => [person._id, person])
    )

    return c.json({
      claims: rows.map((row) => {
        const person = byId.get(row.sanityPersonId)
        return {
          ...row,
          createdAt: row.createdAt.toISOString(),
          personName: person?.name ?? null,
          personSlug: person?.slug ?? null,
        }
      }),
    })
  })

  return app
}
