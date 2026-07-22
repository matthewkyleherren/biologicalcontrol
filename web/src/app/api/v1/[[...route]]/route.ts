import {handle} from 'hono/vercel'
import {createApi, type ApiEnv} from '@biologicalcontrol/api'

export const runtime = 'nodejs'

function envFromProcess(): ApiEnv {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWKS_URL: process.env.CLERK_JWKS_URL,
    AUTH_DEV_BYPASS: process.env.AUTH_DEV_BYPASS,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    GCS_BUCKET: process.env.GCS_BUCKET,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ABLY_API_KEY: process.env.ABLY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_DOMAIN: process.env.RESEND_EMAIL_DOMAIN,
  }
}

const app = createApi({env: envFromProcess()})

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
