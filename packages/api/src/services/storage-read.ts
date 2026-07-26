import {Storage} from '@google-cloud/storage'
import type {ApiEnv} from '../env'
import {gcsConfigured} from '../storage/r2'

type ReadableUrl = {
  url: string
  mode: 'gcs' | 'r2-public'
}

function getStorage(env: ApiEnv) {
  if (env.GCS_SERVICE_ACCOUNT_JSON) {
    const credentials = JSON.parse(env.GCS_SERVICE_ACCOUNT_JSON) as {
      client_email: string
      private_key: string
      project_id?: string
    }
    return new Storage({
      projectId: env.GCP_PROJECT_ID || credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    })
  }
  return new Storage({projectId: env.GCP_PROJECT_ID})
}

function publicR2Url(env: ApiEnv, key: string) {
  if (!env.R2_PUBLIC_BASE_URL) return null
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
}

export async function getReadableUrl(
  env: ApiEnv,
  key: string
): Promise<ReadableUrl | null> {
  if (gcsConfigured(env)) {
    const storage = getStorage(env)
    const file = storage.bucket(env.GCS_BUCKET!).file(key)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    })
    return {url, mode: 'gcs'}
  }

  const url = publicR2Url(env, key)
  if (url) return {url, mode: 'r2-public'}

  return null
}

export async function downloadStorageBytes(
  env: ApiEnv,
  key: string
): Promise<ArrayBuffer | null> {
  if (gcsConfigured(env)) {
    const storage = getStorage(env)
    const [bytes] = await storage.bucket(env.GCS_BUCKET!).file(key).download()
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    return copy.buffer
  }

  const url = publicR2Url(env, key)
  if (!url) return null

  const res = await fetch(url)
  if (!res.ok) return null
  return res.arrayBuffer()
}
