import {and, eq} from 'drizzle-orm'
import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {personClaims} from '@biologicalcontrol/db'
import {createClaimBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'

const reviewClaimBody = z.object({
  status: z.enum(['approved', 'rejected', 'revoked']),
})

export function claimsRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.get('/claims', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const rows = await db.query.personClaims.findMany({
      where: eq(personClaims.userId, user.id),
    })
    return c.json({claims: rows})
  })

  app.get('/claims/pending', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    if (user.role !== 'editor' && user.role !== 'admin') {
      return c.json({error: 'Editor role required'}, 403)
    }

    const rows = await db.query.personClaims.findMany({
      where: eq(personClaims.status, 'pending'),
    })
    return c.json({claims: rows})
  })

  app.post('/claims', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createClaimBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)

    const existingApproved = await db.query.personClaims.findFirst({
      where: and(
        eq(personClaims.sanityPersonId, body.sanityPersonId),
        eq(personClaims.status, 'approved')
      ),
    })
    if (existingApproved && existingApproved.userId !== user.id) {
      return c.json({error: 'This person card is already claimed'}, 409)
    }

    const [claim] = await db
      .insert(personClaims)
      .values({
        userId: user.id,
        sanityPersonId: body.sanityPersonId,
        note: body.note,
        status: 'pending',
      })
      .onConflictDoNothing({
        target: [personClaims.userId, personClaims.sanityPersonId],
      })
      .returning()

    if (!claim) {
      const mine = await db.query.personClaims.findFirst({
        where: and(
          eq(personClaims.userId, user.id),
          eq(personClaims.sanityPersonId, body.sanityPersonId)
        ),
      })
      return c.json({claim: mine})
    }

    return c.json({claim}, 201)
  })

  app.patch('/claims/:id', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = reviewClaimBody.parse(await c.req.json())
    const reviewer = await ensureAppUser(db, auth)
    if (reviewer.role !== 'editor' && reviewer.role !== 'admin') {
      return c.json({error: 'Editor role required'}, 403)
    }

    const claim = await db.query.personClaims.findFirst({
      where: eq(personClaims.id, c.req.param('id')),
    })
    if (!claim) return c.json({error: 'Not found'}, 404)

    if (body.status === 'approved') {
      const other = await db.query.personClaims.findFirst({
        where: and(
          eq(personClaims.sanityPersonId, claim.sanityPersonId),
          eq(personClaims.status, 'approved')
        ),
      })
      if (other && other.id !== claim.id) {
        return c.json({error: 'Another approved claim already exists'}, 409)
      }
    }

    const [updated] = await db
      .update(personClaims)
      .set({
        status: body.status,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(personClaims.id, claim.id))
      .returning()

    return c.json({claim: updated})
  })

  return app
}
