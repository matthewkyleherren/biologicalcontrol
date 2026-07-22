import type {JobType} from '@biologicalcontrol/shared'
import type {Database} from '@biologicalcontrol/db'
import {processingJobs} from '@biologicalcontrol/db'

/** Enqueue a processing job. Fires Inngest when INNGEST_EVENT_KEY is set. */
export async function enqueueJob(
  db: Database,
  input: {
    type: JobType
    subjectType: string
    subjectId: string
    provider?: string
    inngestEventKey?: string
  }
) {
  const [job] = await db
    .insert(processingJobs)
    .values({
      type: input.type,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      status: 'queued',
      provider: input.provider,
    })
    .returning()

  if (input.inngestEventKey) {
    try {
      await fetch(`https://inn.gs/e/${input.inngestEventKey}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: `bc/${input.type}`,
          data: {
            jobId: job!.id,
            subjectType: input.subjectType,
            subjectId: input.subjectId,
          },
        }),
      })
    } catch (err) {
      console.error('[jobs] inngest send failed', err)
    }
  }

  return job!
}
