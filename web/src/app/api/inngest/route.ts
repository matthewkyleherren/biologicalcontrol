import {Inngest} from 'inngest'
import {serve} from 'inngest/next'
import {processJob, type ApiEnv} from '@biologicalcontrol/api'
import {tryCreateDb} from '@biologicalcontrol/db'

export const runtime = 'nodejs'

function envFromProcess(): ApiEnv {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWKS_URL: process.env.CLERK_JWKS_URL,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    AUTH_DEV_BYPASS: process.env.AUTH_DEV_BYPASS,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    GCS_BUCKET: process.env.GCS_BUCKET,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCS_SERVICE_ACCOUNT_JSON: process.env.GCS_SERVICE_ACCOUNT_JSON,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    SANITY_API_WRITE_TOKEN: process.env.SANITY_API_WRITE_TOKEN,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    ABLY_API_KEY: process.env.ABLY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_DOMAIN: process.env.RESEND_EMAIL_DOMAIN,
  }
}

async function processEventJob(jobId: string) {
  if (!jobId) throw new Error('Inngest event is missing data.jobId')
  const env = envFromProcess()
  const db = tryCreateDb(env.DATABASE_URL)
  if (!db) throw new Error('DATABASE_URL is required to process jobs')
  return processJob(db, env, jobId)
}

const inngest = new Inngest({id: 'biologicalcontrol'})

const transcribe = inngest.createFunction(
  {id: 'bc-transcribe', triggers: [{event: 'bc/transcribe'}]},
  async ({event}) => processEventJob(String(event.data.jobId ?? ''))
)

const clarityEdit = inngest.createFunction(
  {id: 'bc-clarity-edit', triggers: [{event: 'bc/clarity_edit'}]},
  async ({event}) => processEventJob(String(event.data.jobId ?? ''))
)

const publishStory = inngest.createFunction(
  {id: 'bc-publish-story', triggers: [{event: 'bc/publish_story'}]},
  async ({event}) => processEventJob(String(event.data.jobId ?? ''))
)

export const {GET, POST, PUT} = serve({
  client: inngest,
  functions: [transcribe, clarityEdit, publishStory],
})
