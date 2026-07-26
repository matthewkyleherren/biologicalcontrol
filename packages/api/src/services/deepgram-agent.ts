import type {ApiEnv} from '../env';

/**
 * Deepgram currently supports browser-safe temporary JWTs via
 * POST https://api.deepgram.com/v1/auth/grant. The browser uses that JWT as
 * `Authorization: Bearer <token>` for wss://agent.deepgram.com/v1/agent/converse;
 * never send DEEPGRAM_API_KEY to the client.
 */

export const DEEPGRAM_AGENT_URL = 'wss://agent.deepgram.com/v1/agent/converse';
export const OPENROUTER_CHAT_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions';
export const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

export type VoiceAgentLanguageHint = 'en' | 'fr' | 'auto';

export type DeepgramAgentConfigInput = {
  languageHint: VoiceAgentLanguageHint;
  openRouterKey?: string;
  openRouterModel?: string;
  openaiKey?: string;
};

export type DeepgramTemporaryKey =
  | {
      ok: true;
      accessToken: string;
      expiresIn: number;
      expiresAt: Date;
    }
  | {
      ok: false;
      reason: string;
      status?: number;
    };

function languageInstruction(languageHint: VoiceAgentLanguageHint) {
  if (languageHint === 'fr') {
    return 'Default to French. Switch to English if the teller does.';
  }
  if (languageHint === 'en') {
    return 'Default to English. Switch to French if the teller does.';
  }
  return 'Match the teller language, English or French. Code-switching is fine.';
}

function greeting(languageHint: VoiceAgentLanguageHint) {
  if (languageHint === 'fr') {
    return 'Bonjour. Je vais vous poser quelques petites questions, puis vous pourrez raconter votre histoire tranquillement.';
  }
  return 'Hello. I will ask a few short questions, then you can tell the story in your own time.';
}

export function buildAgentPrompt(languageHint: VoiceAgentLanguageHint) {
  return [
    'You are a patient spoken interviewer for biologicalcontrol.org, helping elders share memories for a community archive.',
    'You are not a general assistant. Stay in a structured interview and never answer unrelated questions at length.',
    'Never invent names, dates, places, dialogue, programme history, or facts. If something is unclear, ask once or leave it for review.',
    'Keep every agent turn short: one or two sentences. Ask exactly one thing at a time.',
    'Accept incomplete answers. If the teller says they do not remember, move on kindly.',
    'If the teller starts the story early, follow them and gather missing metadata later.',
    'Never claim the story is already published. Review and editor approval happen after this conversation.',
    languageInstruction(languageHint),
    '',
    'Interview state machine:',
    'GREETING: Warm hello; say you will ask a few short questions and then invite the story.',
    'CONSENT: Confirm they understand we record their voice so a machine can write it down, an editor may listen, and they choose later whether the voice itself is published.',
    'WHO: Ask "Who is in this story - you, and anyone else we should name?" Then call save_people.',
    'WHEN: Ask "About when was this - a year, or roughly which years?" Accept soft dates like "late eighties". Then call save_when.',
    'WHERE: Ask "Where were you - Cotonou, Ibadan, a field site, home...?" Then call save_where.',
    'TITLE: Ask "What should we call this one?" Then call save_title.',
    'STORY: Say "This sounds wonderful. Tell me the story, in your own time." Then call begin_story and mostly listen.',
    'CONFIRM: Briefly summarize who, when, where, and title. Ask whether to write it down now.',
    'DONE: When the teller is finished, call finish_story. The UI will show review; stop interviewing unless they ask to retell.',
  ].join('\n');
}

function metadataFunctions() {
  return [
    {
      name: 'save_people',
      description:
        'Persist the names of people mentioned in the story. Call after the WHO answer.',
      parameters: {
        type: 'object',
        properties: {
          peopleNames: {
            type: 'array',
            items: {type: 'string'},
            description: 'Free-text names spoken by the teller.',
          },
          peopleSanityIds: {
            type: 'array',
            items: {type: 'string'},
            description: 'Known Sanity person ids, if the client has matched any.',
          },
        },
      },
    },
    {
      name: 'save_when',
      description: 'Persist the approximate date metadata. Call after the WHEN answer.',
      parameters: {
        type: 'object',
        properties: {
          year: {
            type: 'integer',
            description: 'A four-digit year only when the teller clearly gave one.',
          },
          yearText: {
            type: 'string',
            description: 'Approximate date wording such as "late eighties".',
          },
        },
      },
    },
    {
      name: 'save_where',
      description: 'Persist the free-text place. Call after the WHERE answer.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Free-text location spoken by the teller.',
          },
        },
      },
    },
    {
      name: 'save_title',
      description: 'Persist the requested title. Call after the TITLE answer.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Short story title spoken by the teller.',
          },
        },
        required: ['title'],
      },
    },
    {
      name: 'begin_story',
      description: 'Tell the client that the long story section has started.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'finish_story',
      description:
        'Tell the client that the teller has finished and the UI should prepare review/processing.',
      parameters: {
        type: 'object',
        properties: {
          agentSummary: {
            type: 'string',
            description: 'Brief recap of the metadata and story topic, without new facts.',
          },
        },
      },
    },
  ];
}

function buildThinkConfig(input: DeepgramAgentConfigInput) {
  const prompt = buildAgentPrompt(input.languageHint);
  const common = {
    prompt,
    functions: metadataFunctions(),
    context_length: 12_000,
  };

  if (input.openRouterKey) {
    return {
      ...common,
      provider: {
        type: 'open_ai',
        version: 'v1',
        model: input.openRouterModel ?? 'openai/gpt-4o-mini',
        temperature: 0.2,
        reasoning_mode: 'none',
      },
      endpoint: {
        url: OPENROUTER_CHAT_COMPLETIONS_URL,
        headers: {
          authorization: `Bearer ${input.openRouterKey}`,
          'HTTP-Referer': 'https://biologicalcontrol.org',
          'X-Title': 'biologicalcontrol.org voice story agent',
        },
      },
    };
  }

  if (input.openaiKey) {
    return {
      ...common,
      provider: {
        type: 'open_ai',
        version: 'v1',
        model: 'gpt-4o-mini',
        temperature: 0.2,
        reasoning_mode: 'none',
      },
      endpoint: {
        url: OPENAI_CHAT_COMPLETIONS_URL,
        headers: {
          authorization: `Bearer ${input.openaiKey}`,
        },
      },
    };
  }

  return {
    ...common,
    provider: {
      type: 'open_ai',
      version: 'v1',
      model: 'gpt-4o-mini',
      temperature: 0.2,
      reasoning_mode: 'none',
    },
    prompt: [
      'Server configuration is missing OPENROUTER_API_KEY and OPENAI_API_KEY.',
      'If Deepgram managed OpenAI is unavailable for this account, the agent may not think.',
      prompt,
    ].join('\n\n'),
  };
}

export function buildAgentConfig(input: DeepgramAgentConfigInput) {
  const languageHints =
    input.languageHint === 'auto' ? ['en', 'fr'] : input.languageHint === 'fr' ? ['fr', 'en'] : ['en', 'fr'];

  return {
    type: 'Settings',
    tags: ['biologicalcontrol', 'voice-story-agent'],
    mip_opt_out: true,
    flags: {
      history: true,
    },
    audio: {
      input: {
        encoding: 'linear16',
        sample_rate: 16000,
      },
      output: {
        encoding: 'linear16',
        sample_rate: 24000,
        container: 'none',
      },
    },
    agent: {
      listen: {
        provider: {
          type: 'deepgram',
          version: 'v2',
          model: 'flux-general-multi',
          language_hints: languageHints,
          eot_threshold: 0.7,
          eager_eot_threshold: 0.5,
          eot_timeout_ms: 5000,
          keyterms: [
            'biological control',
            'IITA',
            'Cotonou',
            'Ibadan',
            'cassava',
            'mealybug',
          ],
        },
      },
      think: buildThinkConfig(input),
      speak: {
        provider: {
          type: 'deepgram',
          version: 'v1',
          model: 'aura-2-thalia-en',
          speed: 0.95,
        },
      },
      greeting: greeting(input.languageHint),
    },
  };
}

export async function mintDeepgramTemporaryKey(
  env: ApiEnv,
  ttlSeconds = 120
): Promise<DeepgramTemporaryKey> {
  if (!env.DEEPGRAM_API_KEY) {
    return {ok: false, reason: 'DEEPGRAM_API_KEY is not configured'};
  }

  try {
    const res = await fetch('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST',
      headers: {
        Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ttl_seconds: ttlSeconds}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[deepgram-agent] grant failed', res.status, text);
      return {
        ok: false,
        status: res.status,
        reason: text || `Deepgram grant failed with status ${res.status}`,
      };
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      return {ok: false, reason: 'Deepgram grant response missing access_token'};
    }

    const expiresIn = data.expires_in ?? ttlSeconds;
    return {
      ok: true,
      accessToken: data.access_token,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (err) {
    console.error('[deepgram-agent] grant error', err);
    return {ok: false, reason: 'Could not mint Deepgram temporary key'};
  }
}

export const voiceAgentStageHints = {
  greeting: 'Warm hello and explain the short interview.',
  consent:
    'Confirm recording, machine transcription, editor review, and opt-in public audio.',
  who: 'Ask who is in the story.',
  when: 'Ask roughly when the story happened.',
  where: 'Ask where the story happened.',
  title: 'Ask what to call the story.',
  story: 'Invite the long story and listen patiently.',
  confirm: 'Summarize metadata and say the story will be written down.',
  done: 'Stop the live agent and move the UI to processing/review.',
} as const;
