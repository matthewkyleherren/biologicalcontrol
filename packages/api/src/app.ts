import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {ZodError} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {tryCreateDb} from '@biologicalcontrol/db'
import type {ApiEnv} from './env'
import {getAuthMode} from './env'
import {authMiddleware, type AppEnv} from './middleware/auth'
import {healthRoutes} from './routes/health'
import {meRoutes} from './routes/me'
import {claimsRoutes} from './routes/claims'
import {voiceRoutes} from './routes/voice'
import {photosRoutes} from './routes/photos'
import {chatRoutes} from './routes/chat'
import {uploadsRoutes} from './routes/uploads'
import {webhooksRoutes} from './routes/webhooks'
import {storiesRoutes} from './routes/stories'

export type CreateApiOptions = {
  env: ApiEnv
  db?: Database | null
}

export function createApi(options: CreateApiOptions) {
  const db = options.db ?? tryCreateDb(options.env.DATABASE_URL)
  const app = new Hono<AppEnv>().basePath('/api/v1')

  app.use('*', async (c, next) => {
    c.set('env', options.env)
    c.set('authUser', null)
    c.set('authMode', getAuthMode(options.env))
    await next()
  })

  app.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      allowHeaders: ['Content-Type', 'Authorization'],
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  )

  app.use('*', authMiddleware)

  app.route('/', healthRoutes(db))
  app.route('/', meRoutes(db))
  app.route('/', claimsRoutes(db))
  app.route('/', voiceRoutes(db))
  app.route('/', photosRoutes(db))
  app.route('/', chatRoutes(db))
  app.route('/', uploadsRoutes())
  app.route('/', storiesRoutes(db))
  app.route('/', webhooksRoutes(db))

  app.notFound((c) => c.json({error: 'Not found'}, 404))
  app.onError((err, c) => {
    console.error('[api]', err)
    if (err instanceof ZodError) {
      return c.json({error: 'Invalid request', details: err.flatten()}, 400)
    }
    return c.json({error: 'Internal error'}, 500)
  })

  return app
}

export type ApiApp = ReturnType<typeof createApi>
