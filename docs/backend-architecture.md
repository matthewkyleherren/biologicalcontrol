# Backend architecture — biologicalcontrol.org

## Executive summary

biologicalcontrol.org is a **community folklore / social archive** for everyone who was there — colleagues, partners, spouses, kids on station, friends — sharing the wonderful, funny, and unforgettable things that happened while they shared that world. It is **not** a science victory-lap site, and it does **not** split people into “staff” vs “family.” Today that lives as a Next.js site (`web/`) plus Sanity Studio (`studio/`) for stories, people, galleries, and programme copy. The next backend must be **API-first** so the same capabilities power web, iOS, and Android.

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

**Auth UX is product-critical — and relaxed:** this is a community archive, **not a bank**. Offer **passwords and SMS OTP** as equal, easy paths (plus email magic link). Large type, big tap targets, sensible rate limits. Skip KYC theater, forced complex password rules, and invite-only fortress mode unless spam actually shows up.

**High-value early feature:** **tap-to-record stories** → auto-transcribe (EN + FR) → **human review/edit/approve** → publish. Original audio stays an archival artifact.

**Phased path:** MVP (auth + profiles + claims + contribute) → **voice stories** → chat → bulk photos → AI enhance/face-tag → polish. Face recognition still needs a simple opt-in consent — keep it human, not legalistic.

---

## 1. Goals & non-goals

### Goals

- API-first backend shared by Next.js web, iOS, and Android.
- Account signup/signin that **elderly users can complete alone** (password **or** SMS OTP — both first-class).
- One community of “people who were there” — **no staff vs family product split**.
- Link app users to historical **Sanity `person`** records (claim / “this is me” flow).
- Tag people in stories (Studio + app + web stay coherent).
- Real DMs + optional compound/group threads, with push on mobile.
- Bulk photo dumps with uploader attribution; immutable originals.
- Async enhance + face detect/cluster/match; approximate date inference; “photos of me” feed.
- **Voice storytelling:** record → transcribe → review → publish, with audio retained as archive.
- Roles: **community** (everyone) · **editor** · **admin** (moderation only).
- Light-touch consent for face/voice — clear and kind, not bank-grade compliance theater.

### Non-goals (near term)

- Replacing Sanity for curated programme/story/gallery editorial.
- Building a full LinkedIn/Facebook clone (feeds, ads, public viral growth).
- Differentiating “staff accounts” from “family accounts” in the product.
- Banking-grade security, KYC, mandatory 2FA on every login, or invite-only fortress signup.
- Real-time collaborative document editing inside Studio.
- Self-hosting ML GPUs on day one (use APIs; open-source enhance as cost fallback later).
- Perfect EXIF/date accuracy for every scanned print (heuristics + human confirm).

---

## 2. Recommended stack

### Auth — **Clerk** (primary)

**Pick Clerk** for web + Expo (iOS/Android):

- **Password** sign-up/sign-in (normal, allowed, no sadistic complexity rules).
- **Phone SMS OTP** as an equal alternative (Twilio / SMS provider via Clerk).
- **Email magic link** / email OTP as another easy path.
- Expo SDK (`@clerk/expo`) + Next SDK; session JWTs for API calls.
- Custom auth UI (do **not** ship default tiny Clerk components as-is) — large type, big tap targets.
- Optional Apple / Google later as *extras* on mobile — never required.

**Alternative:** **Supabase Auth** + Twilio (or Twilio Verify) for SMS OTP — excellent if you want Auth + Postgres + Realtime + Storage in one vendor. Slightly weaker “productized” Expo native UI than Clerk; stronger if you prefer one BaaS.

**Not recommended as primary:** Auth.js alone (SMS OTP is DIY via Twilio Verify; more glue for mobile sessions).

#### Auth UX principles (elderly-first, community-grade)

This is a folklore site for people who shared a compound — **not a bank**. Security should be “good enough + kind,” not adversarial.

| Do | Don’t |
| --- | --- |
| Let people pick **password** *or* **SMS code** *or* email link | Treat password as second-class or forbidden |
| Phone → “Send code” → big digit boxes | Tiny CAPTCHAs on every attempt |
| 18–22px+ body, 48px+ tap targets, high contrast | Dense multi-step OAuth walls |
| “Someone can help you on this phone” copy | Force Google/Apple to continue |
| Light rate limits on OTP / login | Invite-only fortress, KYC, or mandatory 2FA on every visit |
| Open (or lightly moderated) signup for the community | Assume every visitor is a fraudster |

#### Light mitigations (only what we actually need)

1. **Rate limits** on OTP send and login failures (per phone/IP) — enough to blunt bots.
2. Turn up friction **if** abuse appears (CAPTCHA after N failures, temporary blocks) — not on day one for everyone.
3. Editors can help someone who lost their phone/email get back in (human trust, known community) — keep a simple note of who helped whom; no audit-committee process.
4. Budget SMS (~$0.05–0.15/msg); monitor monthly. Prefer password/email when SMS is flaky in a region.
5. Skip SIM-swap theater and “step-up auth on claim” until there’s a real problem.

#### Account recovery (keep it human)

- **Self-serve:** password reset, new SMS to same phone, magic link to linked email.
- **Helper on same device:** fine — a spouse or kid can help tap; no special “family role” required.
- **Editor help:** if someone’s locked out, an editor who knows them can rebind phone/email. Keep it simple and kind.

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
| `role` | `community` \| `editor` \| `admin` (default `community`) |
| `locale` | `en` \| `fr` preferred |
| `face_consent_at` | nullable — before face matching |
| `voice_consent_at` | nullable — before storing/publishing audio |

### `profiles`

App-facing profile for anyone in the community (may or may not map to a Sanity `person`).

| Column | Notes |
| --- | --- |
| `user_id` | FK users |
| `bio_short` | |
| `avatar_r2_key` | |
| `how_connected` | free text — e.g. “Insectary 1984–89”, “spouse of …”, “grew up in Cotonou compound” — **not** a staff/family enum |

### `person_claims` — Sanity person ↔ app user (“this is me”)

| Column | Notes |
| --- | --- |
| `id` | |
| `user_id` | FK |
| `sanity_person_id` | Sanity `_id` |
| `status` | `pending` \| `approved` \| `rejected` \| `revoked` |
| `note` | optional “why this is me” |
| `reviewed_by` | user_id nullable |
| `reviewed_at` | |

**Rule:** at most one **approved** claim per `sanity_person_id`. Anyone in the community can claim (or help someone claim) a historical person card — we don’t gate that by staff vs family.

Sanity `person.email` (non-public) can soft-suggest a match; editors can confirm if needed.

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
| `community` | Default for everyone who signs up: chat, upload, voice stories, tag people, claim “this is me,” share folklore |
| `editor` | Moderate, help with claims, promote tags, publish to Sanity, help locked-out users |
| `admin` | Providers, retention knobs, destructive ops |

**No `staff` / `family` / `member` split.** The product is about the shared life of the compound — wonderful, funny, unforgettable stuff that happened while people were there together. How someone was connected is a profile line of text, not a permission class.

### Claiming a historical person (“this is me”)

1. User searches people.
2. Submits claim with an optional note.
3. Soft auto-approve if emails match; otherwise a quick editor glance (or trust-on-first-use once the community is warm).
4. On approve: enable “photos of me” + optional face opt-in.

---

## 8. Voice storytelling (elderly-first)

### UX (web + iOS + Android)

1. Huge **Hold / Tap to record** control; someone can help on the same phone.
2. States: **Idle → Listening (recording) → Processing → Review → Submitted**.
3. Review screen: editable transcript (large type), title, people tags, toggle **“Also publish my voice”**, language confirm.
4. No publish without explicit **Approve & submit**.
5. Same-device helper is fine — no dual accounts.

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
- Clerk project: password + SMS OTP + email magic link; custom large auth screens on web.
- Sync Clerk user → `users` row webhook.

### Phase 1 — MVP social identity

- Profiles (`community` for all), person claim (“this is me”), Sanity person search.
- Contribute story (text) via API → Sanity draft (replace ad-hoc `web` routes gradually).
- Basic “tagged in folklore” from Sanity webhook mirror.

### Phase 2 — Voice stories (**soon after auth — high audience value**)

- Record UI (web + mobile), R2 audio, Deepgram/Whisper job, review/edit/approve, editor publish to Sanity.
- EN + FR language hint; simple consent copy.
- Same-device helper affordances (big buttons, clear states).

### Phase 3 — Chat

- DM + groups, Ably, read cursors, image attachments, push notifications, report/block.

### Phase 4 — Bulk photos

- Multi-upload, attribution, originals immutable, simple albums, manual person tags, “photos of me” for claims.

### Phase 5 — AI enhance + face + dates

- Topaz (or fallback) enhance jobs.
- Face detect/cluster/match **behind a simple opt-in**.
- Date inference heuristics + confirm UI.

### Phase 6 — Polish

- Passkeys/Face ID as convenience, WhatsApp OTP if SMS is flaky in some countries, search, compound directories, Studio tools for promoting app tags.

---

## 11. Cost / ops & privacy

### Rough monthly cost drivers (small community ~hundreds of users)

- Neon + Clerk + R2: low tens of USD at start.
- SMS OTP: watch spend; rate-limit; passwords/email reduce SMS load.
- Ably: free/low tier often enough early.
- Deepgram/Whisper: per-minute audio — voice stories matter; cap duration (e.g. 15–20 min).
- Topaz: per output megapixel — enhance on-demand or editor-triggered, not every upload blindly.
- Face API: per image — batch off-peak; only community-visible photos.

### Privacy principles (kind, not bank-grade)

1. Ask before face matching or keeping/publishing voice — plain language.
2. Default face matching off until someone opts in.
3. Clear copy for older users: what the phone code is, who can hear a recording, how to delete.
4. Editor help for locked-out friends is fine and human.
5. Kids in old photos: editorial common sense; don’t enroll minors’ faces.
6. Remember the point of the site: **shared life and laughter**, not surveillance.

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
- [ ] Equal paths: **Create password** · **Text me a code** · **Email me a link**
- [ ] OTP input: large, auto-advance, paste-friendly
- [ ] “Resend code” with visible cooldown
- [ ] No CAPTCHA unless abuse appears; then only after repeated failures
- [ ] Password: normal strength guidance, not sadistic rules
- [ ] Apple/Google: optional “More options” on mobile only
- [ ] Copy tone: welcoming community archive, not a vault

## Appendix B — Voice review checklist

- [ ] Play back audio on review screen
- [ ] Transcript editable, font ≥ 18–20px
- [ ] Language toggle EN/FR
- [ ] Approve required before submit
- [ ] Consent + “publish audio?” explicit
- [ ] Max duration enforced client + server

---

## 13. Implementation status (2026-07)

Scaffolded in-repo (Clerk keys pending):

| Piece | Status |
| --- | --- |
| `packages/shared` Zod contracts | done |
| `packages/db` Drizzle schema + Neon client | done — `npm run db:push` when `DATABASE_URL` set |
| `packages/api` Hono under `/api/v1` | done — health, me, claims, voice drafts, photos, chat, uploads, webhooks |
| Next mount `web/src/app/api/v1/[[...route]]` | done |
| Auth | `AUTH_DEV_BYPASS=true` until Clerk; JWT decode stub when `CLERK_SECRET_KEY` present |
| R2 / Inngest / Ably / Deepgram | stubs — enqueue rows + signed URL placeholders |
| Sign-in / sign-up pages | placeholders at `/sign-in`, `/sign-up` |

*Living doc — align implementation PRs to phases above; do not expand scope past the current phase without updating this file.*
