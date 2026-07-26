import {eq} from 'drizzle-orm';
import {Hono} from 'hono';
import type {Database} from '@biologicalcontrol/db';
import {users, voiceAgentSessions, voiceStoryDrafts} from '@biologicalcontrol/db';
import type {VoiceAgentMeta} from '@biologicalcontrol/shared';
import {
  completeVoiceAgentStoryBodySchema,
  createVoiceAgentSessionBodySchema,
  voiceAgentEventBodySchema,
} from '@biologicalcontrol/shared';
import type {AppEnv} from '../middleware/auth';
import {requireAuth} from '../middleware/auth';
import {
  buildAgentConfig,
  DEEPGRAM_AGENT_URL,
  mintDeepgramTemporaryKey,
  voiceAgentStageHints,
} from '../services/deepgram-agent';
import {ensureAppUser} from '../services/users';
import {enqueueJob} from '../jobs/enqueue';

type VoiceAgentSessionRow = typeof voiceAgentSessions.$inferSelect;

function isoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function serializeSession(session: VoiceAgentSessionRow) {
  return {
    id: session.id,
    userId: session.userId,
    draftId: session.draftId,
    status: session.status,
    stage: session.stage,
    languageHint: session.languageHint,
    provider: session.provider,
    providerSessionRef: session.providerSessionRef,
    metaJson: session.metaJson ?? {},
    interviewAudioR2Key: session.interviewAudioR2Key,
    storyAudioR2Key: session.storyAudioR2Key,
    transcriptInterview: session.transcriptInterview,
    agentSummary: session.agentSummary,
    consentRecordedAt: isoDate(session.consentRecordedAt),
    error: session.error,
    completedAt: isoDate(session.completedAt),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function mergeMeta(current: VoiceAgentMeta | null, incoming?: VoiceAgentMeta) {
  return {
    ...(current ?? {}),
    ...(incoming ?? {}),
  };
}

async function findOwnedSession(db: Database, userId: string, id: string) {
  const session = await db.query.voiceAgentSessions.findFirst({
    where: eq(voiceAgentSessions.id, id),
  });

  if (!session || session.userId !== userId) {
    return null;
  }

  return session;
}

function transcriptLine(now: Date, label: string, text: string) {
  return `[${now.toISOString()}] ${label}: ${text}`;
}

export function voiceAgentRoutes(db: Database | null) {
  const app = new Hono<AppEnv>();

  app.post('/voice-agent/sessions', async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({error: 'Sign in required'}, 401);
    if (!db) return c.json({error: 'Database not configured'}, 503);

    const body = createVoiceAgentSessionBodySchema.parse(await c.req.json());
    const user = await ensureAppUser(db, auth);
    const env = c.get('env');

    let session: VoiceAgentSessionRow;
    let statusCode: 200 | 201 = 201;

    if (body.resumeSessionId) {
      const existing = await findOwnedSession(db, user.id, body.resumeSessionId);
      if (!existing) return c.json({error: 'Not found'}, 404);
      session = existing;
      statusCode = 200;
    } else {
      const languageHint = body.languageHint ?? user.locale ?? 'auto';
      const consentRecordedAt = user.voiceConsentAt ?? null;
      const [created] = await db
        .insert(voiceAgentSessions)
        .values({
          userId: user.id,
          status: 'active',
          stage: consentRecordedAt ? 'greeting' : 'consent',
          languageHint,
          consentRecordedAt,
        })
        .returning();

      session = created!;
    }

    const settings = buildAgentConfig({
      languageHint: session.languageHint,
      openRouterKey: env.OPENROUTER_API_KEY,
      openRouterModel: env.OPENROUTER_MODEL,
      openaiKey: env.OPENAI_API_KEY,
    });
    const temporaryKey = await mintDeepgramTemporaryKey(env);

    const deepgram = temporaryKey.ok
      ? {
          mode: 'direct_websocket' as const,
          url: DEEPGRAM_AGENT_URL,
          temporaryKey: temporaryKey.accessToken,
          expiresIn: temporaryKey.expiresIn,
          expiresAt: temporaryKey.expiresAt.toISOString(),
          authorizationScheme: 'Bearer' as const,
          settings,
        }
      : {
          mode: 'server_proxy_required' as const,
          url: DEEPGRAM_AGENT_URL,
          reason: temporaryKey.reason,
          settings,
        };

    return c.json(
      {
        session: serializeSession(session),
        consentRequired: !session.consentRecordedAt,
        stageHints: voiceAgentStageHints,
        deepgram,
      },
      statusCode
    );
  });

  app.get('/voice-agent/sessions/:id', async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({error: 'Sign in required'}, 401);
    if (!db) return c.json({error: 'Database not configured'}, 503);

    const user = await ensureAppUser(db, auth);
    const session = await findOwnedSession(db, user.id, c.req.param('id'));
    if (!session) return c.json({error: 'Not found'}, 404);

    return c.json({session: serializeSession(session)});
  });

  app.post('/voice-agent/sessions/:id/events', async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({error: 'Sign in required'}, 401);
    if (!db) return c.json({error: 'Database not configured'}, 503);

    const body = voiceAgentEventBodySchema.parse(await c.req.json());
    const user = await ensureAppUser(db, auth);
    const session = await findOwnedSession(db, user.id, c.req.param('id'));
    if (!session) return c.json({error: 'Not found'}, 404);

    const now = new Date();
    const updates: Partial<typeof voiceAgentSessions.$inferInsert> = {
      updatedAt: now,
    };

    if (body.payload.stage) {
      updates.stage = body.payload.stage;
    }

    if (body.type === 'stage' && !body.payload.stage) {
      return c.json({error: 'Stage event requires payload.stage'}, 400);
    }

    if (body.payload.meta) {
      updates.metaJson = mergeMeta(session.metaJson, body.payload.meta);
    }

    if (body.payload.consent) {
      await db
        .update(users)
        .set({voiceConsentAt: now, updatedAt: now})
        .where(eq(users.id, user.id));
      updates.consentRecordedAt = now;
      if (session.stage === 'consent' && !updates.stage) {
        updates.stage = 'who';
      }
    }

    if (body.payload.text) {
      const nextLine = transcriptLine(now, body.type === 'user_text' ? 'user' : body.type, body.payload.text);
      updates.transcriptInterview = session.transcriptInterview
        ? `${session.transcriptInterview}\n${nextLine}`
        : nextLine;
    }

    if (body.payload.agentSummary) {
      updates.agentSummary = body.payload.agentSummary;
    }

    if (body.payload.error) {
      updates.error = body.payload.error;
    }

    const [updated] = await db
      .update(voiceAgentSessions)
      .set(updates)
      .where(eq(voiceAgentSessions.id, session.id))
      .returning();

    return c.json({session: serializeSession(updated!)});
  });

  app.post('/voice-agent/sessions/:id/complete-story', async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({error: 'Sign in required'}, 401);
    if (!db) return c.json({error: 'Database not configured'}, 503);

    const body = completeVoiceAgentStoryBodySchema.parse(await c.req.json());
    const user = await ensureAppUser(db, auth);
    const session = await findOwnedSession(db, user.id, c.req.param('id'));
    if (!session) return c.json({error: 'Not found'}, 404);
    if (session.status === 'abandoned') {
      return c.json({error: 'Session has been abandoned'}, 409);
    }

    const audioR2Key = body.audioR2Key ?? session.storyAudioR2Key;
    if (!audioR2Key || !body.audioDurationMs) {
      return c.json(
        {error: 'audioR2Key and audioDurationMs are required to create a draft'},
        400
      );
    }

    const consentRecordedAt = session.consentRecordedAt ?? user.voiceConsentAt;
    if (!consentRecordedAt) {
      return c.json({error: 'Voice consent is required before processing'}, 400);
    }

    const now = new Date();
    const meta = session.metaJson ?? {};
    let draftId = session.draftId;

    if (draftId) {
      const existingDraft = await db.query.voiceStoryDrafts.findFirst({
        where: eq(voiceStoryDrafts.id, draftId),
      });
      if (!existingDraft || existingDraft.userId !== user.id) {
        return c.json({error: 'Linked draft not found'}, 404);
      }

      const [updatedDraft] = await db
        .update(voiceStoryDrafts)
        .set({
          audioR2Key,
          audioDurationMs: body.audioDurationMs,
          languageHint: session.languageHint,
          transcriptStatus: 'pending',
          status: 'processing',
          title: meta.title,
          location: meta.location,
          yearText: meta.yearText,
          year: meta.year,
          sanityPersonIds: meta.peopleSanityIds ?? [],
          peopleNames: meta.peopleNames ?? [],
          consentRecordedAt,
          updatedAt: now,
        })
        .where(eq(voiceStoryDrafts.id, draftId))
        .returning();

      draftId = updatedDraft!.id;
    } else {
      const [draft] = await db
        .insert(voiceStoryDrafts)
        .values({
          userId: user.id,
          audioR2Key,
          audioDurationMs: body.audioDurationMs,
          languageHint: session.languageHint,
          transcriptStatus: 'pending',
          status: 'processing',
          title: meta.title,
          location: meta.location,
          yearText: meta.yearText,
          year: meta.year,
          sanityPersonIds: meta.peopleSanityIds ?? [],
          peopleNames: meta.peopleNames ?? [],
          consentRecordedAt,
        })
        .returning();

      draftId = draft!.id;
    }

    const [updatedSession] = await db
      .update(voiceAgentSessions)
      .set({
        draftId,
        status: 'processing',
        stage: 'done',
        storyAudioR2Key: audioR2Key,
        interviewAudioR2Key: body.interviewAudioR2Key ?? session.interviewAudioR2Key,
        providerSessionRef: body.providerRecordingId ?? session.providerSessionRef,
        updatedAt: now,
      })
      .where(eq(voiceAgentSessions.id, session.id))
      .returning();

    await enqueueJob(db, {
      type: 'transcribe',
      subjectType: 'voice_story_draft',
      subjectId: draftId,
      provider: 'deepgram',
      inngestEventKey: c.get('env').INNGEST_EVENT_KEY,
      env: c.get('env'),
    });

    return c.json({
      session: serializeSession(updatedSession!),
      draftId,
    });
  });

  app.post('/voice-agent/sessions/:id/abandon', async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({error: 'Sign in required'}, 401);
    if (!db) return c.json({error: 'Database not configured'}, 503);

    const user = await ensureAppUser(db, auth);
    const session = await findOwnedSession(db, user.id, c.req.param('id'));
    if (!session) return c.json({error: 'Not found'}, 404);

    const [updated] = await db
      .update(voiceAgentSessions)
      .set({
        status: 'abandoned',
        updatedAt: new Date(),
      })
      .where(eq(voiceAgentSessions.id, session.id))
      .returning();

    return c.json({session: serializeSession(updated!)});
  });

  return app;
}
