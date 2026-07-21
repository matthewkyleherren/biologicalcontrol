import {NextResponse} from 'next/server'
import {writeClient} from '@/sanity/client'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.email) {
    return NextResponse.json({error: 'Name and email are required.'}, {status: 400})
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({
      message:
        'Profile request received. Add SANITY_API_WRITE_TOKEN to create Sanity drafts automatically — for now, email the editors to finish setup.',
      queued: true,
    })
  }

  const slug = String(body.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  try {
    const doc = await writeClient.create({
      _type: 'person',
      name: body.name,
      email: body.email,
      role: body.role || undefined,
      yearsActive: body.yearsActive || undefined,
      location: body.location || undefined,
      slug: {_type: 'slug', current: slug || `person-${Date.now().toString(36)}`},
      bio: body.bio
        ? [
            {
              _type: 'block',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', text: String(body.bio)}],
            },
          ]
        : undefined,
      featured: false,
    })

    return NextResponse.json({
      message: `Profile draft created for ${body.name}. It will appear after editorial review.`,
      id: doc._id,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({error: 'Could not create profile.'}, {status: 500})
  }
}
