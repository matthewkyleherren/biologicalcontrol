/**
 * Tiny typed fetch helper for /api/v1.
 * With AUTH_DEV_BYPASS, no Bearer needed.
 * With Clerk later: pass getToken() as getAccessToken.
 */
export async function apiFetch<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    getAccessToken?: () => Promise<string | null>
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const token = options.getAccessToken ? await options.getAccessToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api/v1${path.startsWith('/') ? path : `/${path}`}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API ${res.status}`)
  }
  return res.json() as Promise<T>
}
