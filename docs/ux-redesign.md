# UX redesign — biologicalcontrol.org

Status: in progress, 2026-07-22.
This is the contract every implementation agent works from. Read it fully before editing.

## Why

The site's architecture is sound; the UX is not. Every page — including Messages and
Profile — is laid out as an editorial essay: a mono eyebrow, a 3rem display headline, and a
three-line explanatory paragraph, then the actual content. That rhythm is right for a story
page and wrong for everything a person *does*. Functional surfaces need product chrome:
persistent navigation, search, avatars, timestamps, density, and empty states that teach.

Primary user: a colleague in their 60s–80s, on a phone, who has not used a community site
before. Everything below optimises for *recognition over recall* — it should look like
things they already use.

## The eight problems being fixed

1. **Essay preamble on every page.** Six pages open with the identical eyebrow + huge
   headline + manifesto paragraph. Explanation belongs in empty states and short subtitles.
2. **Messages is not a messaging app.** One scrolling column, a "start a conversation"
   search bolted above the thread list, no avatars, no timestamps, no unread state, no day
   separators, no message grouping. The thread view has a 3rem `<h1>` above the transcript.
3. **Galleries show no photographs.** The gallery index is text tiles with a count.
4. **The people directory is unscannable.** Faux business cards with invented inventory
   codes and "Station TBD" placeholders, three per row, no search, no filter.
5. **No search anywhere** on people, stories, or galleries.
6. **Profile is a settings form,** not a profile. There is no public view of a member.
7. **Auth pages wrap Clerk in prose** instead of being a plain centred card.
8. **Navigation overloads the header** (nine targets) and degrades on mobile to a
   horizontally-scrolling link strip — the least discoverable pattern available.

## Information architecture

Two zones, one visual identity.

**Public / archive** — readable without an account: `/`, `/stories`, `/stories/[slug]`,
`/people`, `/people/[slug]`, `/galleries`, `/galleries/[slug]`, `/programme`.

**Member / app** — requires sign-in: `/chat`, `/chat/[id]`, `/me`, `/settings`,
`/contribute`.

Navigation:

- **Mobile (< 1024px): a fixed bottom tab bar.** Five tabs — Home · People · Stories ·
  Photos · Messages. Icons plus always-visible labels (never icon-only; older users read
  labels). Active tab is ink; inactive is `--color-ink-faint`. 56px tall plus safe-area
  inset. The horizontally-scrolling nav strip is deleted.
- **Mobile top bar:** wordmark left, search icon and avatar-menu right. That is all.
- **Desktop (≥ 1024px): one top bar** — wordmark, primary links, a real search field, a
  "Share a story" primary button, and an avatar dropdown menu (Profile · Messages ·
  Settings · Sign out). The duplicated Profile link and bare `UserButton` are removed;
  everything lives in one menu.
- **Footer** is quiet and single-row; it does not appear on `/chat/*`.

## Screen specifications

### Auth — `/sign-in`, `/sign-up`

A centred card on plain paper. Wordmark above, one-line reassurance below the card, nothing
else. No eyebrow, no display headline, no explanatory paragraph. Clerk's own card supplies
the heading. Full-height centred, max-width ~26rem. Keep the large-input appearance overrides
(min-height 3rem, 1.05rem+ text) — they are correct for the audience.

### Messages — `/chat`

Desktop ≥ 1024px: **two panes.** Left rail (22rem) is the conversation list; right pane is
the open thread, or an empty state prompting a selection. Mobile: the list is the whole
screen; opening a thread pushes a full-screen view with a back arrow.

Conversation list rows: avatar (40px) · name · relative time right-aligned · one-line
message preview, truncated · bold name + preview and a dot when unread. A search field
pinned at the top filters existing threads; a distinct "New message" button opens people
search. Do not leave a people-search box permanently above the list.

### Thread — `/chat/[id]`

A real thread view: sticky header (back arrow on mobile, avatar, name, link to profile),
scrollable transcript, sticky composer. Bubbles: mine right and ink-filled, theirs left and
outlined on paper. Consecutive messages from the same sender within 5 minutes group — the
name and avatar print once. Day separators ("Today", "Yesterday", "14 March"). Every message
shows a time on hover/always at the group's end. The composer is a growing textarea plus a
send button; Enter sends, Shift+Enter newlines, and that is stated in small helper text.
Preserve the existing optimistic-send, Ably subscription, and 12s polling fallback exactly.

### Profile — `/me` and `/people/[slug]`

`/me` becomes a **profile page**, not a form: avatar, display name, how-connected line,
years, location, then tabs — Stories · Photos · About. An "Edit profile" button routes to
`/settings`. Person-claim moves to `/settings` and the `<select>` of 40 names becomes a
searchable list of result rows with a Claim button on each.

`/people/[slug]` gets the same layout for other members, plus a "Message" button when the
viewer is signed in.

### People — `/people`

A dense, searchable directory. A search field filters by name, role, station, and years, live
and client-side. Rows on mobile (avatar · name · role · years), a 2–4-up card grid on
desktop. Keep a *restrained* nod to the business-card idea — hairline rule, mono years — but
delete the fake inventory codes, the rotated "IITA" stamp, and "Station TBD". Missing data is
omitted, never filled with a placeholder.

### Galleries — `/galleries`, `/galleries/[slug]`

The index shows **photographs**: a cover thumbnail per gallery, title, year/location, count.
The detail page is a responsive photo grid with a lightbox (arrow keys, Escape, swipe) and
captions. If a gallery has no images yet, show a labelled empty tile — never a text-only tile
pretending to be a photo gallery.

### Stories — `/stories`, `/stories/[slug]`

Closest to correct today; keep the editorial treatment. Add: search/filter by year and
narrator on the index, and on the detail page a byline block with the narrator's avatar,
plus previous/next navigation at the foot.

### Home — `/`

Keep the rails, but lead with what changed: recent stories, recent photos, new members. Signed
-in users see a personalised strip (unread messages, a prompt to finish their profile). Signed
-out users see the current invitation.

### Contribute — `/contribute`

A real form: grouped fields, visible labels above inputs, helper text below, inline validation
on blur, a disabled-until-valid submit, and a clear success state. Never rely on placeholders
as labels.

## Design system

The visual identity is **locked and unchanged**: warm paper `#f7f7f4`, near-black ink
`#26251e`, leaf accent `#3d5c45`, Geist Sans and Geist Mono. Do not introduce new colours,
new fonts, gradients, glassmorphism, or shadow-heavy cards.

What gets added is a component layer. Build these in `web/src/components/ui/` and use them
everywhere — no more one-off Tailwind chains per page:

`Avatar` (initials fallback, 5 sizes) · `Button` (primary/secondary/ghost/danger, all eight
states) · `Field` (label, input/textarea/select, helper, error) · `SearchInput` ·
`EmptyState` (icon, title, one line, action) · `Skeleton` · `Tabs` · `Menu` (avatar dropdown)
· `Card` · `PageHeader` (small title + optional action — the essay preamble's replacement) ·
`RelativeTime` · `Toast`.

Rules that hold everywhere:

- Tap targets ≥ 44px; body text ≥ 17px; never below 15px for anything a person must read.
- Every colour and font references a token. No inline hex, no bare `font-family`.
- All eight interactive states are implemented: default, hover, focus-visible, active,
  disabled, loading, error, success. Focus rings appear instantly and are never animated.
- Animate `transform` and `opacity` only, 120–240ms, using the existing named easings.
  Honour `prefers-reduced-motion`.
- No horizontal scroll at 320, 375, 414, or 768px. `overflow-x: clip` on `html`/`body`.
  Image grid tracks use `minmax(0, 1fr)`. Long words wrap via `overflow-wrap: anywhere`.
- No clickable text that wraps to two lines — buttons, nav links, tabs, CTAs.
- Headings are always roman. No italic headings.
- Empty states always say what the space is for and offer the action that fills it.
- Loading states are skeletons matching final layout, not a centred "Loading…".
- Errors name what failed and what to do next; they never blame the person.
- **Honest copy:** no invented counts, no fabricated testimonials, no placeholder people.

## Known follow-ups

Real gaps found during the rebuild, in rough order of value. None of these are bugs in what
shipped — they are things the data or the CSS cannot currently support.

1. **No account → person link.** Nothing maps a Sanity `person` document to an app user, so
   `/people/[slug]` cannot offer a "Message" button and the thread view has to resolve a
   profile link by matching display names exactly. A `sanityPersonId` on the `peers[]` of
   `GET /conversations/:id`, or a linked-account field on `PERSON_QUERY`, fixes both. This is
   the highest-value backend addition: "find each other" is the site's whole premise, and
   right now you can find someone and still not be able to write to them.
2. **No real avatars.** `profiles.avatar_r2_key` is a dead column. Clerk's user webhook
   already carries `image_url` and the webhook handler already upserts users — adding a
   nullable `avatar_url` column, populating it there, and returning it from `/me`,
   `/users/search` and conversation `peers[]` would light up avatars across the whole app.
   Everything currently falls back to initials.
3. **The app CSS layer is unlayered.** Everything after the `APP UI LAYER` banner in
   `globals.css` sits outside `@layer`, so it beats every Tailwind utility regardless of
   specificity — a utility cannot override a property a component class sets without `!`.
   Wrapping that block in `@layer components` is the correct fix, but it changes the cascade
   for every surface at once and needs a visual pass, so it was deliberately not done in the
   same change as the rebuild itself.
4. **No "mark as read" endpoint.** Reading is a side effect of fetching messages, so the
   inbox cannot clear a badge without opening the thread. `POST /conversations/:id/read`
   would let a swipe or a menu action do it.
5. **No message pagination.** Threads hard-cap at the most recent 100 messages with no
   cursor. Fine now; not fine after a few years of use.

## Joke themes

`typewriter` and `1994` stay as an opt-in easter egg in Settings, but all joke markup is
removed from `SiteHeader` and `SiteFooter` — the marquee, the File/Edit/View toolbar, the
"Under Construction" line, and the visitor counter. Those move into `themes.css` as
generated content on `[data-theme='retro94']` so the default site's DOM is clean. The theme
switcher moves out of the header gear into `/settings`.
