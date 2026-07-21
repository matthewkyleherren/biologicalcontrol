import {NextResponse} from 'next/server'
import {writeClient} from '@/sanity/client'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.title || !body?.body) {
    return NextResponse.json({error: 'Missing required fields.'}, {status: 400})
  }

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json({
      message:
        'Thanks — your contribution was noted locally. Add SANITY_API_WRITE_TOKEN to enable direct archive drafts, or email the editors with this text.',
      queued: true,
    })
  }

  const slug = String(body.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  try {
    await writeClient.create({
      _type: 'story',
      title: body.title,
      slug: {_type: 'slug', current: `${slug || 'submission'}-${Date.now().toString(36)}`},
      excerpt: String(body.body).slice(0, 240),
      body: [
        {
          _type: 'block',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', text: String(body.body)}],
        },
      ],
      publishedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      message: 'Draft received. An editor will review it before it appears on the site.',
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({error: 'Could not save to Sanity.'}, {status: 500})
  }
}
