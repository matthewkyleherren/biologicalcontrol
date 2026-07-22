export type AuthUser = {
  clerkUserId: string
  email?: string | null
  phoneE164?: string | null
  displayName?: string | null
}

export type AuthMode = 'clerk' | 'dev-bypass' | 'unconfigured'

export type ApiEnv = {
  DATABASE_URL?: string
  CLERK_SECRET_KEY?: string
  CLERK_JWKS_URL?: string
  AUTH_DEV_BYPASS?: string
  R2_ACCOUNT_ID?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET?: string
  R2_PUBLIC_BASE_URL?: string
  GCS_BUCKET?: string
  GCP_PROJECT_ID?: string
  GCS_SERVICE_ACCOUNT_JSON?: string
  CLERK_WEBHOOK_SECRET?: string
  INNGEST_EVENT_KEY?: string
  INNGEST_SIGNING_KEY?: string
  SANITY_API_WRITE_TOKEN?: string
  NEXT_PUBLIC_SANITY_PROJECT_ID?: string
  NEXT_PUBLIC_SANITY_DATASET?: string
  DEEPGRAM_API_KEY?: string
  OPENAI_API_KEY?: string
  ABLY_API_KEY?: string
  RESEND_API_KEY?: string
  RESEND_EMAIL_DOMAIN?: string
}

export function getAuthMode(env: ApiEnv): AuthMode {
  if (env.AUTH_DEV_BYPASS === 'true' || env.AUTH_DEV_BYPASS === '1') {
    return 'dev-bypass'
  }
  if (env.CLERK_SECRET_KEY) return 'clerk'
  return 'unconfigured'
}
