import type {ApiEnv} from '../env'

type SanityMutation = {
  create?: Record<string, unknown>
  createOrReplace?: Record<string, unknown>
  patch?: Record<string, unknown>
}

export async function sanityMutate(env: ApiEnv, mutations: SanityMutation[]) {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = env.SANITY_API_WRITE_TOKEN

  if (!projectId || !token) {
    return {ok: false as const, reason: 'unconfigured' as const}
  }

  const url = `https://${projectId}.api.sanity.io/v2025-01-01/data/mutate/${dataset}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({mutations}),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[sanity]', res.status, text)
    return {ok: false as const, reason: 'error' as const, status: res.status, text}
  }

  const data = (await res.json()) as {results?: Array<{id?: string}>}
  return {ok: true as const, data}
}
