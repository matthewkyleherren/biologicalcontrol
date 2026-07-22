import {eq} from 'drizzle-orm'
import {Hono} from 'hono'
import type {Database} from '@biologicalcontrol/db'
import {personClaims, profiles, users} from '@biologicalcontrol/db'
import {updateProfileBodySchema} from '@biologicalcontrol/shared'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'

export function meRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.get('/me', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    })
    const claim = await db.query.personClaims.findFirst({
      where: eq(personClaims.userId, user.id),
    })
    const approved =
      claim?.status === 'approved'
        ? claim
        : (
            await db.query.personClaims.findMany({
              where: eq(personClaims.userId, user.id),
            })
          ).find((row) => row.status === 'approved')

    return c.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      displayName: user.displayName,
      email: user.email,
      phoneE164: user.phoneE164,
      role: user.role,
      locale: user.locale,
      howConnected: profile?.howConnected ?? null,
      faceConsentAt: user.faceConsentAt?.toISOString() ?? null,
      voiceConsentAt: user.voiceConsentAt?.toISOString() ?? null,
      approvedClaimPersonId: approved?.sanityPersonId ?? null,
    })
  })

  app.patch('/me', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = updateProfileBodySchema.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)

    if (body.displayName || body.locale) {
      await db
        .update(users)
        .set({
          displayName: body.displayName ?? user.displayName,
          locale: body.locale ?? user.locale,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
    }

    if (body.bioShort !== undefined || body.howConnected !== undefined) {
      await db
        .insert(profiles)
        .values({
          userId: user.id,
          bioShort: body.bioShort,
          howConnected: body.howConnected,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            bioShort: body.bioShort,
            howConnected: body.howConnected,
            updatedAt: new Date(),
          },
        })
    }

    return c.json({ok: true})
  })

  return app
}
