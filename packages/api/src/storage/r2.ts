import {Storage} from '@google-cloud/storage'
import type {ApiEnv} from '../env'

/** Prefer GCS (GCP CLI logged in). R2 kept as optional fallback. */
export function gcsConfigured(env: ApiEnv) {
  return Boolean(env.GCS_BUCKET && env.GCP_PROJECT_ID)
}

export function r2Configured(env: ApiEnv) {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET
  )
}

export function buildObjectKey(kind: 'photo' | 'voice' | 'chat', id: string, ext: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  return `originals/${kind}/${stamp}/${id}.${ext.replace(/^\./, '')}`
}

function getStorage(env: ApiEnv) {
  return new Storage({
    projectId: env.GCP_PROJECT_ID,
  })
}

export async function createSignedUploadUrl(
  env: ApiEnv,
  key: string,
  contentType: string
): Promise<{uploadUrl: string; key: string; mode: 'stub' | 'gcs' | 'r2'}> {
  if (gcsConfigured(env)) {
    try {
      const storage = getStorage(env)
      const file = storage.bucket(env.GCS_BUCKET!).file(key)
      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000,
        contentType,
      })
      return {key, mode: 'gcs', uploadUrl}
    } catch (err) {
      console.error('[storage] GCS signed URL failed', err)
      return {
        key,
        mode: 'stub',
        uploadUrl: `https://upload.stub.local/${encodeURIComponent(key)}?gcs=error`,
      }
    }
  }

  if (r2Configured(env)) {
    return {
      key,
      mode: 'r2',
      uploadUrl: `https://upload.stub.local/${encodeURIComponent(key)}?pending=r2-sdk`,
    }
  }

  return {
    key,
    mode: 'stub',
    uploadUrl: `https://upload.stub.local/${encodeURIComponent(key)}`,
  }
}
