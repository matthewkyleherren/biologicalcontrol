# Voice Story Agent — product & technical spec

**Status:** draft for discussion  
**Audience:** product + engineering  
**Related:** [backend-architecture.md §8](./backend-architecture.md) (tap-to-record foundation), `/contribute` text form today

---

## 0. Verdict first

This is the right product bet for biologicalcontrol.org.

The community is mostly people in their **60s–80s**, often on phones, sharing compound memories. Asking them to fill a title / year / location / body form is asking them to do office work. A **spoken interview** that feels like sitting with a patient listener is a much better fit than “cool AI.”

We should **not** jump straight to a free-form Siri clone. We already sketched and partially scaffolded a simpler pipeline: **record → transcribe → review → publish** (`voice_story_drafts`, R2 uploads, Deepgram job, submit route). The conversational orb is a **structured interview layer on top of that**, not a replacement for it.

**Recommended path:** ship a reliable record + review path first (or in parallel as fallback), then add the interviewer agent as the primary contribute experience.

---

## 1. Product intent

### Problem

Typing is the bottleneck. Metadata fields feel like paperwork. Storytellers stall before they start. Helpers on the same phone can tap, but still have to invent titles and years.

### Opportunity

A large, calm **talk button** (orb) that:

1. Starts a short spoken interview.
2. Gently gathers **who / when / where** in plain conversation.
3. Asks for a **title** (“What should we call this one?”).
4. Invites the story: *“This sounds wonderful — tell me the story.”*
5. Transcribes, lightly cleans for clarity (without inventing facts), and shows the result for **OK / change / try again**.

### What success looks like

- An author (or helper) can produce a reviewable draft **without typing a paragraph**.
- The resulting text still sounds like **them**, not like ChatGPT memoir.
- Editors get better metadata (people, year, place) than the empty form fields we get today.
- Abandoned sessions do not leave mysterious half-published stories.

### Non-goals (v1)

- Free-form chat about the programme, science Q&A, or “anything AI.”
- Multi-speaker group storytelling with diarization.
- Fully automatic publish with no human OK.
- Replacing Sanity editorial review.
- Perfect year/place extraction when the teller is vague — ask once, accept “around the late eighties,” store soft values.
- Native mobile app requirement (web-first; Expo later reuses the same API).

---

## 2. Design principles (elderly-first)

1. **One job on screen.** Orb + short status line + one primary action. No dashboard of chips.
2. **Patient interviewer, not clever assistant.** Warm, slow, interruptible. Never rush.
3. **Always recoverable.** Big Stop, Pause, Start over, Switch to typing.
4. **Same-device helper is first-class.** Spouse/kid can tap the orb; no dual login.
5. **Typing is optional escape hatch**, not the main path — keep `/contribute` form.
6. **Honest edits.** AI may fix punctuation, remove false starts, and order a rambling retelling — it must **not** invent names, dates, jokes, or moral lessons.
7. **Fit the design system.** Cool gray paper, black ink, cobalt accent. The orb can pulse softly; avoid purple glow, neon glass, or assistant-mascot chrome that fights the archive voice ([design.md](../design.md)).
8. **Tap targets ≥ 48–56px**, body ≥ 18px, high contrast, `prefers-reduced-motion` respected.
9. **EN + FR**, including code-switching. Prefer multilingual models; let the user correct language on review.
10. **Consent before capture.** Plain language: we store the recording, a machine writes it down, an editor may listen, you choose whether the voice itself is published.

---

## 3. Experience spec

### Entry points

| Surface | Behaviour |
| --- | --- |
| `/contribute` | Primary: “Tell it out loud” (orb). Secondary: “Write instead” → existing form. |
| Home / empty states / story CTAs | Link to `/contribute` (same as today). Optional later: deep link `/contribute?mode=voice`. |
| `/me` drafts (later) | Resume incomplete voice sessions. |

### Orb states

| State | What the user sees / hears |
| --- | --- |
| **Idle** | Large cobalt orb. Label: “Tap to talk.” Helper: “Someone can help you on this phone.” |
| **Connecting** | Soft pulse. “Getting ready…” (mic permission + session start). |
| **Listening** | Clear listening cue. Status shows the *current question stage*, not a transcript dump. |
| **Agent speaking** | Orb in “speaking” motion; large **Interrupt** control (barge-in). |
| **Storytelling** | After the invitation, longer listening window; gentle “Still listening” every ~20–30s of silence only if needed. |
| **Working** | “Writing that down…” — no fake progress percentages. |
| **Review** | Title, meta summary, edited story text, audio replay, Approve / Edit / Retell. |
| **Submitted** | Same success pattern as text contribute: editor will read it. |
| **Error** | Plain cause + next step (“Microphone blocked — open browser settings”, “Connection dropped — tap to continue”). |

### Conversation script (structured stages)

The agent is a **state machine with natural language**, not an open chat.

```
GREETING
  → CONSENT (if not already recorded for this user/session)
  → WHO      “Who is in this story — you, and anyone else we should name?”
  → WHEN     “About when was this — a year, or roughly which years?”
  → WHERE    “Where were you — Cotonou, Ibadan, a field site, home…?”
  → TITLE    “What should we call this one?”
  → STORY    “This sounds wonderful. Tell me the story, in your own time.”
  → CONFIRM  brief spoken summary of meta + “I’ll write that down now.”
  → REVIEW   (UI; agent stops talking unless user asks to retell)
```

**Rules for the agent:**

- Ask **one thing at a time**.
- Accept incomplete answers; do not grill.
- If the teller starts the story early, **follow them** — extract meta later or on review.
- If they say “I don’t remember,” move on.
- Keep agent turns short (1–2 sentences).
- Default language from user `locale`; switch if they speak the other.
- Never claim the story is already published.

### Review screen (non-negotiable)

Large type. Fields prefilled from the session:

- Title
- About year (optional, may be approximate text + optional integer)
- Where (optional free text)
- People mentioned (chips → map to Sanity `person` where possible; free names OK)
- Story body (edited transcript)
- Toggle: **Also publish my voice** (default off)
- Actions: **Looks good — send to editors** · **Edit the text** · **Tell it again** · **Save and finish later**

No publish without explicit approve. Editor queue remains.

### Fallback modes

1. **Tap-to-record monologue** — skip interview; one long recording → ASR → same review UI (already in backend architecture §8).
2. **Type it** — current form.
3. **Helper mode copy** — “Hand the phone to someone who can tap for you.”

---

## 4. How this relates to what we already have

### Already in the repo

- `voice_story_drafts` table (audio key, duration, transcript raw/edited, title, people ids, year, publishAudio, status).
- `POST /voice-drafts`, `GET /voice-drafts/:id`, `POST /voice-drafts/:id/submit`.
- R2 signed uploads for `kind: 'voice'`.
- Job enqueue for `transcribe` (Deepgram) and `publish_story` (Sanity).
- `voiceConsentAt` on users.
- Text contribute → `POST /stories/drafts`.

### Gap this feature fills

The scaffold assumes **one uploaded recording + async ASR + form review**.  
This spec adds:

- A **live conversational session** before/around the story capture.
- Structured **metadata extraction** during talk.
- **Light editorial rewrite** pass with human OK.
- A contribute UI centered on an **orb**, not a hold-to-record button alone.

### Data model extensions (proposed)

Keep `voice_story_drafts` as the publishable artifact. Add a session table for the interview:

```
voice_agent_sessions
  id
  user_id
  draft_id                  nullable until story audio exists
  status                    idle|active|processing|review|abandoned|completed
  stage                     greeting|consent|who|when|where|title|story|confirm|done
  language_hint             en|fr|auto
  provider                  openai_realtime|deepgram_agent|custom
  provider_session_ref
  meta_json                 { peopleNames[], peopleSanityIds[], year?, yearText?, location?, title? }
  interview_audio_r2_key    optional full-session archive
  story_audio_r2_key        optional isolated story segment
  transcript_interview      optional
  agent_summary             optional short spoken/ recap text
  consent_recorded_at
  error
  created_at / updated_at / completed_at
```

On “write that down”:

1. Ensure `voice_story_drafts` row (link `draft_id`).
2. Run **story ASR** (Deepgram) on story segment (or full session with stage timestamps).
3. Run **clarity edit** LLM job → `transcript_edited` + fill title/year/people from `meta_json` if empty.
4. Move session + draft to `review`.

---

## 5. Technical approach

### 5.1 Recommended architecture (v1)

**Hybrid realtime + async jobs** — best fit for our stack (Next/Hono/Neon/R2/Inngest).

```
Browser (orb UI)
  ↔ WebRTC or WebSocket voice session (provider Realtime / Voice Agent API)
  ↔ Our API: create session, persist stage events, consent, abandon
  → On STORY complete: audio (or provider recording URL) → R2
  → Inngest: transcribe (Deepgram) → clarity_edit (LLM) → status=review
  → User approves → existing submit/publish_story path → Sanity draft
```

**Why hybrid**

- Realtime voice is good for interview turn-taking.
- Archival ASR should still go through **Deepgram** (already chosen) so EN/FR elderly speech and job retries stay consistent.
- Clarity edit is a separate, auditable step with a strict system prompt.
- Publish path stays identical to text/voice drafts.

### 5.2 Provider options

| Option | Role | Pros | Cons | Recommendation |
| --- | --- | --- | --- | --- |
| **Deepgram Voice Agent** | Live agent (listen + speak) + Nova ASR | One speech vendor with Phase A; ~$210 credit; strong EN/FR ASR | “Think” still needs an LLM key (OpenRouter / OpenAI / Anthropic) | **Primary — locked** |
| **OpenAI Realtime API** | Live agent (STT+LLM+TTS) | Strong conversational UX | Second realtime voice stack; extra cost | Fallback only if Voice Agent UX fails |
| **Custom**: Deepgram streaming STT + LLM + TTS | Full control | Maximum control over stages | More glue, latency tuning | Fallback if managed agent fights our state machine |
| **Browser SpeechRecognition** | Device STT only | Cheap | Unreliable, not archival, weak FR | **UX hint only — never source of truth** |

**Decision (2026-07-26):** Deepgram-first. Phase A = Nova/batch ASR. Phase B = Voice Agent for the orb. LLM for agent “think” + clarity edit via **OpenRouter** (or direct OpenAI/Anthropic) — not OpenAI Realtime.

### 5.3 Clarity edit job

Input: raw story transcript + structured meta.  
Output: `transcript_edited`, optional title suggestion if missing.

System rules (enforce in prompt + eval examples):

- Preserve meaning and voice; remove filler / false starts.
- Fix punctuation and paragraph breaks for reading.
- Do **not** add facts, names, dates, or dialogue not present.
- Do **not** “improve” humour or add programme history.
- If unclear, leave wording close to original and flag `needs_human_pass: true`.
- Output plain text (or portable-text-friendly paragraphs), not markdown essays.

Store both `transcript_raw` and `transcript_edited`. UI defaults to edited; “Show what I said” toggle reveals raw.

### 5.4 API sketch (appends to frontend contract)

```
POST /voice-agent/sessions
  body: { languageHint?, resumeSessionId? }
  → { sessionId, clientSecretOrUrl, stage, consentRequired }

POST /voice-agent/sessions/:id/events
  body: { type: 'stage'|'meta'|'user_text'|'error'|'heartbeat', payload }
  → { session }

POST /voice-agent/sessions/:id/complete-story
  body: { audioR2Key?, audioDurationMs?, providerRecordingId? }
  → { session, draftId }   // enqueues transcribe + clarity_edit

GET  /voice-agent/sessions/:id
POST /voice-agent/sessions/:id/abandon

# existing
POST /uploads/signed-url   kind: voice
GET  /voice-drafts/:id
POST /voice-drafts/:id/submit
```

Realtime credentials must be **short-lived**, scoped to the user session, never long-lived OpenAI keys in the browser.

### 5.5 Client constraints

- **HTTPS + mic permission** with a rehearsal explanation screen before the browser prompt.
- Prefer **Chrome/Safari recent**; detect unsupported browsers early and offer type/record fallback.
- Cap story listen length (e.g. **15–20 minutes**) with a kind warning at 12 minutes.
- Auto-save meta as tools fire so refresh doesn’t lose the interview.
- Wake lock / “keep screen on” while Listening / Storytelling.
- Network blip: attempt resume; otherwise “Tap to continue from Where we left off.”

### 5.6 Accessibility & inclusion

- Visible captions of **agent speech** (and optionally live partial user transcript) for hard-of-hearing users — captions are UI chrome, not the archival transcript.
- Do not rely on colour-only state; include text status.
- Reduced motion: static orb + opacity only.
- FR copy parity for all chrome strings and agent prompts.

---

## 6. Trust, privacy, retention

Extends backend-architecture §8 privacy notes:

1. Consent checkbox / spoken confirm before first capture: storage, transcription by subprocessors, optional public audio, editor listen for moderation.
2. Interview audio vs story audio: retain story audio as archive by default for published pieces; interview may be shorter retention (e.g. 30 days) unless needed for disputes.
3. Abandoned sessions: delete audio after N days (align with 30-day draft policy).
4. Subprocessors listed in privacy copy: realtime provider, Deepgram, OpenAI (edit), R2.
5. Training opt-out flags where providers offer them.
6. `publishAudio` remains **opt-in**, default false.

---

## 7. Phased delivery plan

Do not estimate calendar weeks; scope by dependency and risk.

### Phase A — Foundations (unblocks both monologue and agent)

- Finish Inngest `transcribe` + `publish_story` workers (Deepgram → draft review → Sanity).
- Hardening: signed upload, duration caps, consent, draft GET polling.
- Contribute page: add **Tap to record** monologue path + review UI (even without orb agent).
- Outcome: voice stories possible without live AI conversation.

### Phase B — Interview agent MVP (orb)

- `voice_agent_sessions` + APIs.
- Provider spike winner wired with stage tools (`save_people`, `save_when`, `save_where`, `save_title`, `begin_story`, `finish_story`).
- Orb UI on `/contribute` (Idle → … → Review).
- Complete-story → existing draft pipeline + clarity edit job.
- Fallbacks: monologue record + type form always available.
- Outcome: elderly-first path matches the product story above.

### Phase C — Quality & ops

- Eval set: 20–30 sample stories (EN/FR, soft speech, code-switch, long pauses).
- Tune prompts; measure edit faithfulness (human spot-check rubric).
- Cost dashboards per session; abuse rate limits.
- Person-name linking assist (search Sanity people from extracted names).
- Resume abandoned sessions from `/me`.

### Phase D — Mobile

- Expo screen reusing APIs; native mic UX; push when draft is ready if they background the app.

---

## 8. UX copy starter (EN)

- Idle: “Tap to talk.”
- Helper: “Someone can help you on this phone.”
- Consent: “We’ll record your voice so we can write the story down. An editor may listen before it appears. You choose later whether the recording itself is published.”
- After meta: “This sounds wonderful. Tell me the story — take your time.”
- Working: “Writing that down…”
- Review header: “Does this sound like you?”
- Approve: “Looks good — send to editors”
- Error mic: “This browser blocked the microphone. Open settings, allow the mic, then tap to try again.”

FR strings: maintain in the same file as other product chrome; agent system prompt loads locale-specific script.

---

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Realtime latency / talk-over confusion | Explicit Interrupt; short agent turns; barge-in tested on Android Chrome |
| Hallucinated “cleanup” | Strict edit prompt; store raw; show diff/raw toggle; editor still reviews |
| Mic permission fear | Explain before prompt; helper mode; type fallback |
| Cost spikes from long sessions | Duration cap; idle timeout; abandon cleanup |
| Accents / FR-EN mix | Multilingual ASR; language confirm on review; eval corpus |
| Over-scoped v1 | Phase A monologue ships value even if agent slips |
| Design-system clash (“Siri orb”) | Cobalt/paper motion language; no purple glow; status text primary |

---

## 10. Open decisions (need product confirmation)

1. **LLM for Voice Agent “think” + clarity edit** — OpenRouter vs direct OpenAI/Anthropic?
2. **Is Phase A (monologue) required before B**, or do we prototype the orb directly with stubbed review?
3. **Approximate dates** — store free-text `yearText` (“late eighties”) in addition to integer `year`?
4. **Interview audio retention** — 30 days vs keep with published provenance?
5. **Auto-suggest Sanity person matches** in v1 review, or free-text names only at first?
6. **Should the agent speak FR by default** when `users.locale=fr`, or ask once at greeting?

---

## 11. Implementation checklist (when we build)

- [ ] Schema: `voice_agent_sessions` + draft link fields (`location`, `year_text` if approved)
- [ ] Shared Zod types + OpenAPI/frontend-contract updates
- [ ] Session routes + short-lived provider credentials
- [ ] Inngest: `transcribe`, `clarity_edit`, reuse `publish_story`
- [ ] `/contribute` mode switcher + Orb component in `web/src/components/ui` or `contribute/`
- [ ] Review screen shared by monologue + agent paths
- [ ] Consent + privacy copy
- [ ] Browser support gate + fallbacks
- [ ] Basic eval notes in `docs/` for prompt regressions
- [ ] Cost/rate-limit env knobs

---

## 12. Summary recommendation

Build this — it matches the audience better than any form iteration will. Treat it as a **structured voice interview into the existing draft/publish pipeline**, not a general chatbot. Ship **record → review** as the reliability floor; make the **orb interviewer** the welcoming front door. Keep edits humble, consent clear, and typing available for anyone who wants it.
