# Frontend ↔ backend contract

What the UI can actually render today. Read this before designing any screen — several
familiar patterns are *not* supported by the data and must not be faked.

## Calling the API

`web/src/lib/api.ts` exports `apiFetch<T>(path, {method?, body?, getAccessToken?})`. It
prefixes `/api/v1`, sets `Authorization: Bearer <token>` when `getAccessToken` resolves, and
throws `Error(responseText)` on non-2xx. In client components:

```ts
const {getToken, isLoaded} = useAuth()
const tokenFn = useCallback(() => getToken(), [getToken])
const data = await apiFetch<Shape>('/conversations', {getAccessToken: tokenFn})
```

Always gate the first fetch on Clerk's `isLoaded`.

## Endpoints

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/me` | `{id, clerkUserId, displayName, email, phoneE164, role, locale, howConnected, faceConsentAt, voiceConsentAt, approvedClaimPersonId}` |
| PATCH | `/me` | `{ok:true}` — body `{displayName?, bioShort?, howConnected?, locale?}` |
| GET | `/claims` | `{claims: [{id, sanityPersonId, status, note}]}` — the caller's own |
| GET | `/claims/pending` | same shape; **403 unless role is editor/admin** |
| POST | `/claims` | `{claim}` — body `{sanityPersonId, note?}`; 409 if already claimed by someone |
| PATCH | `/claims/:id` | `{claim}` — body `{status: 'approved'\|'rejected'\|'revoked'}`; editor/admin only |
| GET | `/users/search?q=` | `{users: [{id, displayName, howConnected}]}` — empty `q` returns 30 recent members |
| GET | `/conversations` | `{conversations: EnrichedConversation[]}` |
| POST | `/conversations/dm` | `{conversation}` — body `{peerUserId}`; idempotent |
| POST | `/conversations/group` | `{conversation}` — body `{title, memberUserIds[], compoundLabel?}` |
| GET | `/conversations/:id` | `{conversation}`; 404 if not a member |
| GET | `/conversations/:id/messages` | `{messages: Message[]}` — last 100, chronological. **Side effect: marks the thread read.** |
| POST | `/conversations/:id/messages` | `{message}` — body `{body?, clientId (uuid), attachmentR2Key?}`; idempotent on `clientId` |
| GET | `/chat/token` | `{tokenRequest, clientId}` for Ably, or `{error, mode:'poll'}` when Ably is unconfigured |
| POST | `/stories/drafts` | body `{title, body, year?, location?, sanityPersonIds[]}` |
| POST | `/uploads/signed-url` | `{uploadUrl, key, mode, headers}` — body `{kind:'photo'\|'voice'\|'chat', contentType, extension?}` |

`EnrichedConversation`:

```ts
{
  id: string
  type: 'dm' | 'group'
  title: string          // already computed — peers' names for a DM
  compoundLabel: string | null
  peers: Array<{id: string; displayName: string}>
  memberCount: number
  unreadCount: number    // added by the redesign
  lastMessage: {id, body, senderId, senderName, createdAt} | null
  createdAt: string
  updatedAt: string
}
```

`Message`: `{id, conversationId, senderId, senderName, body, clientId, editedAt, deletedAt, createdAt, updatedAt}`.

Two Next route handlers bypass the Hono API and write straight to Sanity:
`POST /api/contribute` (`{name, email, title, body}`) and `POST /api/profile` (`{name, email}`).

## Realtime

Ably. Channel `conversation:{id}`, single event `message`, payload is the full `Message`.
`GET /chat/token` returns a `TokenRequest`; the client re-fetches it from an `authCallback`.
When Ably is unconfigured the thread falls back to polling every 12s. **Keep both paths.**

## Sanity content

`web/src/sanity/queries.ts` — `SETTINGS_QUERY`, `FEATURED_STORIES_QUERY`,
`LATEST_STORIES_QUERY`, `ALL_STORIES_QUERY`, `STORY_QUERY($slug)`, `PEOPLE_QUERY`,
`FEATURED_PEOPLE_QUERY`, `PERSON_QUERY($slug)`, `GALLERIES_QUERY`, `GALLERY_QUERY($slug)`,
`PROGRAMME_QUERY`, `HOME_COUNTS_QUERY`.

Images: `person.portrait`, `story.mainImage`, `gallery.photos[]` are Sanity images with
`alt` and hotspot. Render through `urlFor()` from `web/src/sanity/image.ts`.
`GALLERIES_QUERY` already returns a `cover` (the gallery's first photo) and `photoCount`.

Every Sanity fetch is wrapped in `.catch(() => fallback)` — Sanity may be empty in some
environments, and `web/src/lib/fallback-content.ts` supplies sample content. Preserve that.

## Gaps — do not fake these

- **No app-user avatars.** `profiles.avatar_r2_key` exists but nothing writes it, and no
  endpoint returns an avatar URL. Use the `Avatar` primitive's initials fallback everywhere
  except the signed-in user's own chrome, where Clerk's `user.imageUrl` is available.
  Sanity `person.portrait` *is* real and should be used on people pages.
- **No read receipts, typing indicators, or presence.** Ably grants the capability; nothing
  publishes it. Do not build "Seen" or "typing…" UI.
- **No message reactions, edits, or deletes.** The columns exist; no routes do.
- **No comments** on stories, photos, or galleries.
- **No pagination.** Messages hard-cap at the most recent 100 with no cursor. Do not build
  an infinite scroller that silently loads nothing.
- **No message attachment URLs.** Attachments can be recorded but not retrieved. Do not
  render an attachment UI.
- **No global search endpoint.** Search is per-page and client-side over already-fetched
  lists (people, stories, galleries), or `/users/search` for members.
- **Real counts only.** `HOME_COUNTS_QUERY` gives genuine story/people/gallery counts. Never
  invent a member count, a view count, or an engagement stat.
