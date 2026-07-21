# Backend architecture — biologicalcontrol.org

## Executive summary

biologicalcontrol.org is a **community folklore / social archive** for IITA Biological Control / PHMD alumni **and families** — not a science victory-lap site. Today that lives as a Next.js site (`web/`) plus Sanity Studio (`studio/`) for stories, people, galleries, and programme copy. The next backend must be **API-first** so the same capabilities power web, iOS, and Android.

**Split of concerns:** keep **Sanity as the editorial folklore CMS** (curated stories, people bios, galleries, programme). Build an **app backend** (Postgres + object storage + jobs + realtime) for users, claims, chat, bulk photos, processing jobs, and social graph. Publish-ready folklore still lands in Sanity (with optional app mirrors for feeds that need joins).

**Recommended stack (opinionated):**

| Layer | Pick | Why |
| --- | --- | --- |
| Auth | **Clerk** (+ Twilio SMS under the hood) | First-class SMS OTP + email magic links on web *and* Expo; custom large-type screens; optional Apple/Google later |
| App DB | **Neon Postgres** + Drizzle | Relational model for users, tags, chat, photos, jobs |
| CMS | **Sanity** (keep) | Editorial workflow already started |
| API | **Hono + OpenAPI** in `packages/api` | One contract for Next + mobile; avoid tRPC-only mobile pain |
| Realtime chat | **Ably** (or PartyKit) | Reliable DM/group fan-out without running Socket.IO |
| Media | **Cloudflare R2** | Originals + derivatives; cheap egress |
| Jobs | **Inngest** | Enhance, face-tag, date inference, transcription — durable steps |
| Voice → text | **Deepgram** (primary), Whisper API fallback | Multilingual EN/FR, good for elderly speech, async jobs |

**Auth UX is product-critical:** password is optional; **SMS one-time code is the primary path**; email magic link second; passkeys/Face ID later. Invite-only signup + admin-assisted recovery for a small trusted community.

**High-value early feature:** **tap-to-record stories** → auto-transcribe (EN + FR) → **human review/edit/approve** → publish. Original audio stays an archival artifact.

**Phased path:** MVP (auth + profiles + claims + contribute) → **voice stories** → chat → bulk photos → AI enhance/face-tag → polish. Face recognition needs explicit consent; elderly users and families make privacy non-negotiable.

---

## 1. Goals & non-goals

### Goals

- API-first backend shared by Next.js web, iOS, and Android.
- Account signup/signin that **elderly users can complete alone** (SMS OTP primary).
- Link app users to historical **Sanity `person`** records (claim flow).
- Tag people in stories (Studio + app + web stay coherent).
- Real DMs + optional compound/group threads, with push on mobile.
- Bulk photo dumps with uploader attribution; immutable originals.
- Async enhance + face detect/cluster/match; approximate date inference; “photos of me” feed.
- **Voice storytelling:** record → transcribe → review → publish, with audio retained as archive.
- Roles: member, family, editor, admin.
- Privacy-first face/voice handling with consent and retention policies.

### Non-goals (near term)

- Replacing Sanity for curated programme/story/gallery editorial.
- Building a full LinkedIn/Facebook clone (feeds, ads, public viral growth).
- Real-time collaborative document editing inside Studio.
- Self-hosting ML GPUs on day one (use APIs; open-source enhance as cost fallback later).
- Perfect EXIF/date accuracy for every scanned print (heuristics + human confirm).
- Public open signup without invite/moderation.

---

## 2. Recommended stack

### Auth — **Clerk** (primary)

**Pick Clerk** for web + Expo (iOS/Android):

- Native **phone SMS OTP** sign-up/sign-in (Twilio / SMS provider configured in Clerk).
- **Email magic link** / email OTP as the second passwordless path.
- Passwords **optional** (never the only gate); no forced complex password rules for SMS users.
- Expo SDK (`@clerk/expo`) + Next SDK; session JWTs for API calls.
- Custom auth UI (do **not** ship default tiny Clerk components as-is) — large type, big tap targets.
- Optional Apple / Google later as *extras* on mobile — never required.

**Alternative:** **Supabase Auth** + Twilio (or Twilio Verify) for SMS OTP — excellent if you want Auth + Postgres + Realtime + Storage in one vendor. Slightly weaker “productized” Expo native UI than Clerk; stronger if you prefer one BaaS.

**Not recommended as primary:** Auth.js alone (SMS OTP is DIY via Twilio Verify; more glue for mobile sessions).

#### Auth UX principles (elderly-first)

| Do | Don’t |
| --- | --- |
| Phone number → “Send code” → big digit boxes | Password-only signup |
| Email magic link as backup | Tiny CAPTCHAs on every attempt |
| 18–22px+ body, 48px+ tap targets, high contrast | Dense multi-step OAuth walls |
| “A family member can help on this phone” copy | Force Google/Apple to continue |
| Invite code or waitlist before first SMS | Open signup that burns SMS budget to bots |

#### SMS cost, fraud, SIM swap (light mitigations)

For a **small trusted community**, keep risk low without banking-grade KYC:

1. **Invite-only** signup (editor issues invite codes / allowlisted phones/emails).
2. **Rate limits:** OTP send per phone/IP; cooldown; max failed verifies.
3. **Twilio fraud/geo filters** + block disposable routes if needed.
4. **Admin-assisted account linking:** editors can verify identity offline (email/WhatsApp from known alumni) and bind phone ↔ user ↔ Sanity person — document this as exceptional, audited.
5. SIM-swap residual risk: critical actions (claim person, export data, delete account) may require a second factor later (email confirm) — not on every login.
6. Budget: expect ~$0.05–0.15/SMS depending on country; West Africa / Switzerland / US mix — monitor Clerk/Twilio dashboards monthly.

#### Account recovery (family-helper — privacy vs practicality)

Document explicitly in product + privacy policy:

- **Self-serve:** new SMS to same phone; magic link to linked email.
- **Family helper on same device:** helper may operate the UI *with the member present*; no separate “login as” for family by default.
- **Admin-assisted recovery:** member (or designated family contact on file) contacts editors; admin verifies via known programme context; rebinds phone/email. Log who approved, when, evidence type. **Do not** allow silent takeover via “spouse email only” without a recorded consent/verification step.
- Optional later: designated **recovery contacts** (opt-in), who can *request* reset but not alone approve it.

### Primary app DB — **Neon Postgres**

Own: users/profiles, roles, claims, conversations/messages, photos/tags/jobs, voice drafts, device tokens, moderation flags.

### Sanity — what stays

Keep as source of truth for **published folklore**:

- `story`, `person`, `gallery`, `themeTag`, `programme`, `siteSettings` (existing schemas).
- Editorial review in Studio; portable text; programme narrative.

App backend **references** Sanity IDs (`sanityPersonId`, `sanityStoryId`) rather than duplicating full bios. Optional sync: webhook Sanity → Postgres cache table for search/joins.

### API layer — **Hono + OpenAPI** (`packages/api`)

- Single OpenAPI 3 contract → typed clients for web + mobile (Orval / openapi-typescript).
- Mount via Next route handler *or* separate Worker/Fly service; start colocated with Next for speed.
- Auth: verify Clerk JWT on every protected route.

**Short alternative:** Supabase client + RLS (faster MVP, less custom API). Tradeoff: mobile + complex joins + job orchestration get messier; face/voice pipelines still need Inngest outside.

**Avoid as sole API:** tRPC-only (great for Next, awkward for native Swift/Kotlin/Expo without extra bridge).

### Realtime for chat — **Ably**

- Presence, delivery, typing optional; pub/sub per conversation channel.
- Persist messages in Postgres; Ably is transport.
- Why not DIY WebSockets: mobile reconnects, battery, horizontal scale — not worth it for this community size yet.

**Alternative:** Supabase Realtime on the messages table if you choose the Supabase stack.

### Object storage — **Cloudflare R2**

Buckets (logical prefixes):

- `originals/` — immutable uploads (photos + voice).
- `derivatives/` — enhanced, thumbs, webp.
- `transcripts/` — optional raw ASR JSON.
- Signed PUT for direct client upload; CDN read via custom domain.

### Job queue — **Inngest**

Steps with retries/timeouts for: enhance, face pipeline, date inference, **transcription**, Sanity publish, push fan-out.

**Alternative:** Trigger.dev (similar DX). BullMQ if you already run Redis workers. Temporal only if workflows become very long/complex.

---

## 3. Data model (Postgres)

IDs: `uuid` PKs unless noted. Timestamps: `created_at`, `updated_at`. Soft-delete where moderation needs history.

### `users`

| Column | Notes |
| --- | --- |
| `id` | PK |
| `clerk_user_id` | unique |
| `phone_e164` | nullable unique |
| `email` | nullable |
| `display_name` | |
| `role` | `member` \| `family` \| `editor` \| `admin` |
| `locale` | `en` \| `fr` preferred |
| `invite_code_used` | |
| `face_consent_at` | nullable — required before enrollment |
| `voice_consent_at` | nullable — before storing/publishing audio |
| `recovery_notes` | admin-only text |

### `profiles`

App-facing profile; may exist without a Sanity person (family members).

| Column | Notes |
| --- | --- |
| `user_id` | FK users |
| `bio_short` | |
| `avatar_r2_key` | |
| `relationship` | `alumni` \| `spouse` \| `child` \| `friend` \| `other` |

### `person_claims` — Sanity person ↔ app user

| Column | Notes |
| --- | --- |
| `id` | |
| `user_id` | FK |
| `sanity_person_id` | Sanity `_id` |
| `status` | `pending` \| `approved` \| `rejected` \| `revoked` |
| `evidence` | JSON (email match, admin note) |
| `reviewed_by` | user_id nullable |
| `reviewed_at` | |

**Rule:** at most one **approved** claim per `sanity_person_id`. Family users typically do **not** claim a person; they follow/relate instead (`person_follows` optional).

Sanity `person.email` (already in schema, non-public) can auto-suggest claims; final approval is editor.

### `story_person_tags` (app mirror / community tags)

For tags created in-app before/alongside Sanity:

| Column | Notes |
| --- | --- |
| `sanity_story_id` | |
| `sanity_person_id` | |
| `source` | `studio` \| `app` \| `ai_suggested` |
| `created_by` | user_id nullable |
| `confidence` | for AI |

Canonical published tags remain on Sanity `story.people[]`; webhook syncs into this table for “stories mentioning me”.

### Chat

**`conversations`:** `id`, `type` (`dm` \| `group`), `title` nullable, `created_by`, `compound_label` optional (e.g. station nickname).

**`conversation_members`:** `conversation_id`, `user_id`, `role` (`member` \| `admin`), `muted`, `last_read_at`.

**`messages`:** `id`, `conversation_id`, `sender_id`, `body` text nullable, `created_at`, `edited_at`, `deleted_at`, `client_id` (idempotency).

**`message_attachments`:** `message_id`, `r2_key`, `mime`, `width`, `height`, `kind` (`image` \| `audio` \| `file`).

**`message_receipts` (optional granular):** `message_id`, `user_id`, `delivered_at`, `read_at` — or derive read from `last_read_at` for MVP.

### Photos

**`photos`:**

| Column | Notes |
| --- | --- |
| `id` | |
| `uploader_id` | FK users — attribution |
| `original_r2_key` | immutable |
| `sha256` | dedupe |
| `byte_size`, `mime`, `width`, `height` | |
| `exif_taken_at` | nullable |
| `inferred_taken_at` | nullable |
| `inferred_taken_at_confidence` | 0–1 |
| `inferred_taken_at_basis` | JSON (exif, gallery_year, co_tags, …) |
| `sanity_gallery_id` | nullable link |
| `visibility` | `private` \| `community` \| `public` |
| `enhance_status` | `none` \| `queued` \| `done` \| `failed` |
| `enhanced_r2_key` | nullable |

**`photo_attributions`:** explicit credit line, optional `photographer_name` if not uploader.

**`photo_person_tags`:**

| Column | Notes |
| --- | --- |
| `photo_id` | |
| `sanity_person_id` | nullable if unknown cluster |
| `face_cluster_id` | nullable |
| `bbox` | JSON |
| `source` | `human` \| `ai` \| `uploader` |
| `confidence` | |
| `confirmed_by` | user_id |
| `confirmed_at` | |

**`face_clusters`:** `id`, `centroid` (vector ref / external id), `suggested_person_id`, `status` (`unknown` \| `linked` \| `rejected`).

**`face_enrollments`:** `user_id` or `sanity_person_id`, embedding ref, `consent_at` — only after `face_consent_at`.

### Jobs & moderation

**`processing_jobs`:** `id`, `type` (`enhance` \| `face_detect` \| `face_match` \| `date_infer` \| `transcribe` \| `publish_story`), `subject_type`, `subject_id`, `status`, `provider`, `provider_ref`, `attempts`, `error`, `result` JSON.

**`moderation_flags`:** target, reason, reporter, status.

**`device_tokens`:** `user_id`, `platform` (`ios` \| `android` \| `web`), `token`, `last_seen_at` — for push.

### Voice stories

**`voice_story_drafts`:**

| Column | Notes |
| --- | --- |
| `id` | |
| `user_id` | narrator / uploader |
| `audio_r2_key` | original archival audio |
| `audio_duration_ms` | |
| `language_hint` | `en` \| `fr` \| `auto` |
| `transcript_status` | `pending` \| `processing` \| `ready` \| `failed` |
| `transcript_raw` | ASR output |
| `transcript_edited` | user-approved text |
| `title` | optional until review |
| `sanity_person_ids` | tags chosen at review |
| `publish_audio` | bool — publish audio with text? |
| `status` | `recording` \| `processing` \| `review` \| `submitted` \| `published` \| `rejected` |
| `sanity_story_id` | set on publish |
| `consent_recorded_at` | |

---

## 4. Person tagging in stories — sync

```
Studio (canonical publish)          App / Web (community)
        │                                    │
        ▼                                    ▼
 Sanity story.people[]  ◄── webhook ──  story_person_tags
        │                                    │
        └── editors can accept app suggestions via Studio
            or admin “promote tag to Sanity” API
```

1. **Studio** remains canonical for *published* folklore tags (`story.people`, gallery photo `people`).
2. App users propose tags → `story_person_tags` with `source=app`; editors promote into Sanity.
3. Sanity webhook (`create/update` on story/gallery) upserts mirror rows for “tagged in folklore” queries.
4. Claimed users see **“Stories & photos of me”** = union of Sanity tags + confirmed `photo_person_tags` where `sanity_person_id` matches claim.
5. AI suggestions stay `ai_suggested` until human confirm (uploader, claimed person, or editor).

---

## 5. Chat / messaging

### Scope

- **DM** (1:1) — create-or-get by sorted user pair.
- **Group / compound threads** — titled groups; optional `compound_label`.
- Media in chat via R2 attachments (images first; audio later).
- **Read receipts:** MVP = `last_read_at` per member; later per-message if needed.
- **Moderation:** report message → flag; editors can soft-delete; block user (hide DMs).
- **Push:** on new message if recipient offline — APNs + FCM via Expo Notifications; deep link to conversation.

### Flow

1. Client inserts via `POST /conversations/:id/messages` (idempotent `client_id`).
2. API writes Postgres → publishes Ably event → triggers push job if needed.
3. Clients subscribe to `conversation:{id}` while open.

Keep chat **out of Sanity**.

---

## 6. Photo pipeline

```
Client                    API / R2                 Inngest workers
  │                         │                           │
  ├─ signed PUT original ──►│ originals/ (immutable)    │
  ├─ POST /photos meta ────►│ Photo + Attribution       │
  │                         ├─ enqueue enhance ────────►│ Topaz Image API (or fallback)
  │                         ├─ enqueue face ───────────►│ detect → cluster → match
  │                         └─ enqueue date_infer ─────►│ EXIF + heuristics
  │                                                     │
  └─ GET /me/photos ◄────── confirmed tags on claimed person
```

### Upload & attribution

- Direct-to-R2 multipart/signed URL; server stores `uploader_id`, optional caption, album.
- Never overwrite `original_r2_key`; derivatives only in `derivatives/`.

### Enhance — realistic options (2026)

| Option | Role |
| --- | --- |
| **Topaz Labs Image API** (`api.topazlabs.com/image/v1`) | **Primary** — async enhance/restore/denoise; poll status; download derivative. Consumer desktop CLI is not a reliable server path (CLI gated/enterprise). Credit-based $/megapixel. |
| **Cloudinary** generative restore / upscale | Good managed fallback; easier ops, less “Topaz look”. |
| **Self-host Real-ESRGAN + CodeFormer/GFPGAN** | Cost control for bulk archival; GPU worker (Fly/RunPod); quality/ops tradeoff. |
| Desktop Topaz batch | Offline curator tool only — not the product pipeline. |

Worker: Inngest step → POST Topaz async → poll → PUT derivative to R2 → update `photos.enhanced_*`.

### Face detect + cluster + match

1. Detect faces (AWS Rekognition, Google Vision, or open `insightface` on worker).
2. Embed + cluster unknowns (`face_clusters`).
3. Match against enrollments **only if** person/user consented.
4. Surface “Is this you?” / “Is this X?” confirmations in app.
5. Confirmed tags power **Photos of me**.

### Date inference heuristics (ordered)

1. EXIF `DateTimeOriginal` if plausible (1975–present).
2. Upload batch context / user-entered decade.
3. Linked Sanity `gallery.year` / `story.year`.
4. Co-occurring confirmed people ∩ `yearsActive` overlap.
5. Filenames / folder names from bulk dump (`scan_1987/`).
6. Store basis JSON + confidence; UI shows “About 1987” not false precision.

### Photos of me

`GET /me/photos` → photos where approved claim’s `sanity_person_id` ∈ confirmed `photo_person_tags`, visibility allows, ordered by `inferred_taken_at` then `created_at`.

---

## 7. Auth & roles

| Role | Capabilities |
| --- | --- |
| `member` | Alumni-style: chat, upload, voice stories, tag, claim *one* person |
| `family` | Same social features; claim discouraged; can be linked as relative of a person |
| `editor` | Moderate, approve claims, promote tags, publish to Sanity, recovery assist |
| `admin` | Roles, invites, retention, provider keys, destructive ops |

### Claiming a historical person

1. User searches Sanity people (read API).
2. Submits claim (+ optional note / email proof).
3. Auto-approve only if Clerk email matches Sanity `person.email` (strict); else editor queue.
4. On approve: `person_claims.status=approved`; enable “photos of me” + face enrollment prompt (consent).

---

## 8. Voice storytelling (elderly-first)

### UX (web + iOS + Android)

1. Huge **Hold / Tap to record** control; optional family-helper copy on screen.
2. States: **Idle → Listening (recording) → Processing → Review → Submitted**.
3. Review screen: editable transcript (large type), title, people tags, toggle **“Also publish my voice”**, language confirm.
4. No publish without explicit **Approve & submit**.
5. Same-device helper is fine; do not require dual accounts for MVP.

### Transcription stack

| Priority | Provider | Notes |
| --- | --- | --- |
| **Primary** | **Deepgram** (nova multilingual / nova-2) | Strong async API, EN+FR, noisy archival speech OK, webhook/Inngest friendly |
| **Fallback** | **OpenAI Whisper API** | Reliable baseline; good FR/EN; simpler ops |
| Optional | AssemblyAI | Solid alt; speaker labels if group storytelling later |
| Device-only | Apple Speech / Android SpeechRecognizer | **Not** archival source of truth — flaky offline; may pre-fill UX only |

Detect/hint language: user `locale` + `language_hint`; store ASR `detected_language`. Plan for **code-switching** (EN/FR) — prefer multilingual models; allow user to correct language on review.

### Pipeline

```
Record on device
    → signed PUT audio to R2 originals/voice/{draftId}.m4a|webm
    → POST /voice-drafts (consent timestamp required)
    → Inngest `transcribe`
         → Deepgram (fallback Whisper on failure)
         → save transcript_raw, status=review
    → User edits transcript_edited, title, tags, publish_audio
    → POST /voice-drafts/:id/submit
    → Editor queue (or auto if trusted role)
    → publish worker creates Sanity `story`:
         title, body from transcript_edited, narrator ref if claimed,
         people refs, year if provided,
         optional audio asset uploaded to Sanity or linked R2 URL in custom field
    → draft.status=published, sanity_story_id set
```

**Architecture split:** draft + audio + ASR live in **app DB + R2**; **published folklore text** goes to **Sanity** (consistent with editorial archive). Optional: keep `voice_story_drafts` as provenance forever.

### Privacy & retention (audio)

- Capture **voice consent** before upload (`voice_consent_at` + checkbox: storage, transcription by processor, optional public audio).
- Default: retain original audio **as archival** for approved published stories; allow “delete my audio, keep text”.
- Rejected/abandoned drafts: delete audio after **N days** (e.g. 30) unless user saves.
- Processors (Deepgram/OpenAI): DPA/subprocessor list in privacy policy; no training opt-out flags as available.
- Editors can hear audio only when moderating.

---

## 9. Mobile

- **Expo** app in `apps/mobile` (or `mobile/`) sharing OpenAPI client.
- Auth: Clerk Expo — custom SMS UI matching web large-type patterns; SecureStore for session.
- API: `Authorization: Bearer <clerk_jwt>`.
- Push: Expo push → store `device_tokens`.
- Offline (light): draft voice locally until upload; queue failed photo uploads; chat offline send queue with `client_id` retry — no full offline-first DB in MVP.
- Passkeys / Face ID: phase after SMS is solid (Clerk supports; use as convenience re-auth).

---

## 10. Phased roadmap

### Phase 0 — Foundation (1–2 weeks)

- Monorepo layout (`packages/api`, Drizzle, Neon, R2, Inngest stub).
- Clerk project: SMS OTP + email magic link; invite codes; custom large auth screens on web.
- Sync Clerk user → `users` row webhook.

### Phase 1 — MVP social identity

- Profiles, roles, person claim queue, Sanity person search.
- Contribute story (text) via API → Sanity draft (replace ad-hoc `web` routes gradually).
- Basic “tagged in folklore” from Sanity webhook mirror.

### Phase 2 — Voice stories (**soon after auth — high audience value**)

- Record UI (web + mobile), R2 audio, Deepgram/Whisper job, review/edit/approve, editor publish to Sanity.
- EN + FR language hint; retention/consent copy.
- Family-helper UX affordances.

### Phase 3 — Chat

- DM + groups, Ably, read cursors, image attachments, push notifications, report/block.

### Phase 4 — Bulk photos

- Multi-upload, attribution, originals immutable, simple albums, manual person tags, “photos of me” for claims.

### Phase 5 — AI enhance + face + dates

- Topaz (or fallback) enhance jobs.
- Face detect/cluster/match **behind consent**.
- Date inference heuristics + confirm UI.

### Phase 6 — Polish

- Passkeys/Face ID, recovery contacts, WhatsApp OTP experiment (Twilio) for regions where SMS is flaky, search, compound directories, Studio tools for promoting app tags, cost dashboards.

---

## 11. Cost / ops & privacy

### Rough monthly cost drivers (small community ~hundreds of users)

- Neon + Clerk + R2: low tens of USD at start.
- SMS OTP: dominant variable — mitigate with invites + rate limits.
- Ably: free/low tier often enough early.
- Deepgram/Whisper: per-minute audio — voice stories matter; cap duration (e.g. 15–20 min).
- Topaz: per output megapixel — enhance on-demand or editor-triggered, not every upload blindly.
- Face API: per image — batch off-peak; only community-visible photos.

### Privacy principles (faces, elderly, families)

1. **Consent before biometrics** (face enrollment); separate consent for voice storage/ASR/publish.
2. Default face matching off until opt-in; unknown clusters are not public profiles.
3. Clear language for older users: what the phone code is, who can hear voice, how to delete.
4. Admin recovery is logged and exceptional.
5. Prefer minimizing processors; publish subprocessors list.
6. Children in historical photos: editorial judgment; no face enrollment for minors; tagging policy for editors.

---

## 12. Monorepo mapping

**Recommended evolution** (non-breaking first):

```
biologicalcontrol/
  apps/
    web/                 # move from web/ when ready
    mobile/              # Expo
    studio/              # move from studio/
  packages/
    api/                 # Hono routers + OpenAPI
    db/                  # Drizzle schema + migrations
    shared/              # zod types, role enums
  workers/               # optional — or Inngest functions inside packages/api
  docs/
    backend-architecture.md
```

**Pragmatic near-term (less churn):**

```
web/                     # Next stays
studio/                  # Sanity stays
api/                     # new — Hono or Next route modules gradually
packages/db/
packages/shared/
mobile/                  # Expo when started
docs/
```

Existing `web/src/app/api/contribute` and `profile` become thin clients of `packages/api` (or get replaced) once Clerk + Postgres claims exist. Sanity schemas gain optional fields later: `audioUrl` / `audioFile` on `story`, `claimedByClerkId` is **not** stored in Sanity — keep claims in Postgres only.

### Scaffold order for an engineer

1. Neon + Drizzle (`users`, `person_claims`) + Clerk webhooks.
2. OpenAPI `GET /health`, `GET /me`, `POST /claims`.
3. Custom SMS sign-in pages (web).
4. Voice draft upload + Inngest transcribe + review endpoints.
5. Ably chat tables + routes.
6. R2 photo upload + job stubs.
7. Expo app against same OpenAPI.

---

## Appendix A — Auth screen checklist

- [ ] Phone field with country code preset (community defaults: NG, BJ, CI, CH, US, …)
- [ ] Single primary CTA: “Text me a code”
- [ ] OTP input: large, auto-advance, paste-friendly
- [ ] “Resend code” with visible cooldown
- [ ] “Use email instead” secondary
- [ ] No CAPTCHA unless abuse appears; then invisible/friction only after N attempts
- [ ] Password: hidden behind “More options”, never required for SMS users
- [ ] Apple/Google: “More options” on mobile only

## Appendix B — Voice review checklist

- [ ] Play back audio on review screen
- [ ] Transcript editable, font ≥ 18–20px
- [ ] Language toggle EN/FR
- [ ] Approve required before submit
- [ ] Consent + “publish audio?” explicit
- [ ] Max duration enforced client + server

---

*Living doc — align implementation PRs to phases above; do not expand scope past the current phase without updating this file.*
