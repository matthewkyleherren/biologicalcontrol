import {eq} from 'drizzle-orm'
import type {Database} from '@biologicalcontrol/db'
import {profiles, users} from '@biologicalcontrol/db'
import type {AuthUser} from '../env'

/** Ensure a Postgres user+profile exists for this Clerk (or dev) identity. */
export async function ensureAppUser(db: Database, auth: AuthUser) {
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, auth.clerkUserId),
  })
  if (existing) {
    return existing
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId: auth.clerkUserId,
      email: auth.email ?? null,
      phoneE164: auth.phoneE164 ?? null,
      displayName: auth.displayName?.trim() || 'Friend',
      role: 'community',
    })
    .returning()

  await db.insert(profiles).values({
    userId: created!.id,
    howConnected: null,
  })

  return created!
}
