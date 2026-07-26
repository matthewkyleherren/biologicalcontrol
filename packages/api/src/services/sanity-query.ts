import type {ApiEnv} from '../env'

export async function sanityQuery<T>(
  env: ApiEnv,
  query: string,
  params?: Record<string, unknown>
): Promise<{ok: true; result: T} | {ok: false; reason: 'unconfigured' | 'error'; status?: number; text?: string}> {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = env.SANITY_API_WRITE_TOKEN

  if (!projectId || !token) {
    return {ok: false, reason: 'unconfigured'}
  }

  const url = new URL(`https://${projectId}.api.sanity.io/v2021-06-07/data/query/${dataset}`)
  url.searchParams.set('query', query)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(`$${key}`, JSON.stringify(value))
    }
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {ok: false, reason: 'error', status: res.status, text}
  }

  const data = (await res.json()) as {result: T}
  return {ok: true, result: data.result}
}
