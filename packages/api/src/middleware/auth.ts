import {verifyToken} from '@clerk/backend'
import type {Context, Next} from 'hono'
import type {AuthMode, AuthUser, ApiEnv} from '../env'
import {getAuthMode} from '../env'

export type AppVariables = {
  authUser: AuthUser | null
  authMode: AuthMode
  env: ApiEnv
}

export type AppEnv = {
  Variables: AppVariables
}

const DEV_USER: AuthUser = {
  clerkUserId: 'dev_bypass_user',
  email: 'dev@biologicalcontrol.org',
  phoneE164: null,
  displayName: 'Dev Community Friend',
}

/**
 * Resolve the caller.
 * - AUTH_DEV_BYPASS=true → fixed local user
 * - Authorization: Bearer <clerk_jwt> → verified with CLERK_SECRET_KEY
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const env = c.get('env')
  const mode = getAuthMode(env)
  c.set('authMode', mode)

  if (mode === 'dev-bypass') {
    c.set('authUser', DEV_USER)
    return next()
  }

  const header = c.req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    c.set('authUser', null)
    return next()
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    c.set('authUser', null)
    return next()
  }

  if (mode === 'clerk' && env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      })
      c.set('authUser', {
        clerkUserId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : null,
        phoneE164:
          typeof payload.phone_number === 'string' ? payload.phone_number : null,
        displayName:
          typeof payload.name === 'string'
            ? payload.name
            : typeof payload.full_name === 'string'
              ? payload.full_name
              : null,
      })
      return next()
    } catch (err) {
      console.error('[auth] clerk verify failed', err)
      return c.json({error: 'Invalid or expired session'}, 401)
    }
  }

  c.set('authUser', null)
  return next()
}

export function requireAuth(c: Context<AppEnv>) {
  const user = c.get('authUser')
  if (!user) {
    return null
  }
  return user
}
