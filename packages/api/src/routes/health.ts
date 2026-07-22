import {Hono} from 'hono'
import type {Database} from '@biologicalcontrol/db'
import {sql} from 'drizzle-orm'
import {getAuthMode} from '../env'
import type {AppEnv} from '../middleware/auth'

export function healthRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.get('/health', async (c) => {
    const env = c.get('env')
    let database: 'connected' | 'unconfigured' | 'error' = env.DATABASE_URL
      ? 'connected'
      : 'unconfigured'

    if (db && env.DATABASE_URL) {
      try {
        await db.execute(sql`select 1`)
        database = 'connected'
      } catch {
        database = 'error'
      }
    }

    return c.json({
      ok: true as const,
      service: 'biologicalcontrol-api' as const,
      authMode: getAuthMode(env),
      database,
      storage: env.GCS_BUCKET ? 'gcs' : env.R2_BUCKET ? 'r2' : 'unconfigured',
    })
  })

  return app
}
