import {and, desc, eq, inArray, isNotNull} from 'drizzle-orm'
import {Hono} from 'hono'
import {z} from 'zod'
import type {Database} from '@biologicalcontrol/db'
import {personClaims, photoAttributions, photoPersonTags, photos} from '@biologicalcontrol/db'
import type {AppEnv} from '../middleware/auth'
import {requireAuth} from '../middleware/auth'
import {ensureAppUser} from '../services/users'
import {enqueueJob} from '../jobs/enqueue'

const createPhotoBody = z.object({
  originalR2Key: z.string().min(1),
  mime: z.string().optional(),
  byteSize: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  sha256: z.string().optional(),
  caption: z.string().max(2000).optional(),
  photographerName: z.string().max(200).optional(),
  visibility: z.enum(['private', 'community', 'public']).default('community'),
  enqueueEnhance: z.boolean().default(false),
})

export function photosRoutes(db: Database | null) {
  const app = new Hono<AppEnv>()

  app.post('/photos', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const body = createPhotoBody.parse(await c.req.json())
    const user = await ensureAppUser(db, auth)

    const [photo] = await db
      .insert(photos)
      .values({
        uploaderId: user.id,
        originalR2Key: body.originalR2Key,
        mime: body.mime,
        byteSize: body.byteSize,
        width: body.width,
        height: body.height,
        sha256: body.sha256,
        caption: body.caption,
        visibility: body.visibility,
        enhanceStatus: body.enqueueEnhance ? 'queued' : 'none',
      })
      .returning()

    if (body.photographerName) {
      await db.insert(photoAttributions).values({
        photoId: photo!.id,
        photographerName: body.photographerName,
      })
    }

    if (body.enqueueEnhance) {
      await enqueueJob(db, {
        type: 'enhance',
        subjectType: 'photo',
        subjectId: photo!.id,
        provider: 'topaz',
        inngestEventKey: c.get('env').INNGEST_EVENT_KEY,
      })
    }

    await enqueueJob(db, {
      type: 'date_infer',
      subjectType: 'photo',
      subjectId: photo!.id,
      provider: 'heuristics',
      inngestEventKey: c.get('env').INNGEST_EVENT_KEY,
    })

    return c.json({photo}, 201)
  })

  app.get('/me/photos', async (c) => {
    const auth = requireAuth(c)
    if (!auth) return c.json({error: 'Sign in required'}, 401)
    if (!db) return c.json({error: 'Database not configured'}, 503)

    const user = await ensureAppUser(db, auth)
    const claims = await db.query.personClaims.findMany({
      where: eq(personClaims.userId, user.id),
    })
    const claim = claims.find((row) => row.status === 'approved')

    if (!claim) {
      return c.json({
        photos: [],
        message: 'Claim a person card to see photos of you',
      })
    }

    const tags = await db.query.photoPersonTags.findMany({
      where: and(
        eq(photoPersonTags.sanityPersonId, claim.sanityPersonId),
        isNotNull(photoPersonTags.confirmedAt)
      ),
    })
    const ids = tags.map((t) => t.photoId)
    if (!ids.length) return c.json({photos: []})

    const rows = await db.query.photos.findMany({
      where: inArray(photos.id, ids),
      orderBy: [desc(photos.inferredTakenAt), desc(photos.createdAt)],
    })

    return c.json({photos: rows})
  })

  return app
}
