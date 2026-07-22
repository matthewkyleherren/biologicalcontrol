import {Hono} from 'hono'
import {z} from 'zod'
import {randomUUID} from 'node:crypto'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {buildObjectKey, createSignedUploadUrl} from '../storage/r2'

const signedUploadBody = z.object({
  kind: z.enum(['photo', 'voice', 'chat']),
  contentType: z.string().min(3).max(120),
  extension: z.string().min(1).max(12).optional(),
})

function extensionFromContentType(contentType: string, fallback = 'bin') {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  }
  return map[contentType] ?? fallback
}

export function uploadsRoutes() {
  const app = new Hono<AppEnv>()

  app.post('/uploads/signed-url', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)

    const body = signedUploadBody.parse(await c.req.json())
    const env = c.get('env')
    const ext = body.extension ?? extensionFromContentType(body.contentType)
    const key = buildObjectKey(body.kind, randomUUID(), ext)
    const signed = await createSignedUploadUrl(env, key, body.contentType)

    return c.json({
      uploadUrl: signed.uploadUrl,
      key: signed.key,
      mode: signed.mode,
      headers: {
        'Content-Type': body.contentType,
      },
    })
  })

  return app
}
