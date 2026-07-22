# biologicalcontrol.org — design system

Locked visual system for the IITA Biological Control folklore archive.

## Two layers

The site does two different jobs and needs two different treatments. Conflating them was the
root cause of the July 2026 UX rebuild — see [docs/ux-redesign.md](docs/ux-redesign.md).

| | **Read** layer | **Use** layer |
| --- | --- | --- |
| Surfaces | home, stories, story pages, programme | messages, profile, settings, auth, contribute, directories, galleries |
| Voice | editorial — display headline, generous measure, long-form prose | product — page header, search, density, timestamps, avatars |
| Opens with | a headline that earns its size | `PageHeader`: title, at most one line, and the action |
| Explains itself via | the writing | empty states, helper text, inline validation |

Both layers share one identity. Neither gets its own palette, its own fonts, or its own
button. If a surface needs a component that does not exist in `web/src/components/ui/`,
build it there rather than inventing a one-off.

## Brand

- **Domain:** biologicalcontrol.org
- **Concept:** folklore archive for everyone who was there — one community, shared compound life
- **Identity:** sharp Geist sans, warm beige paper, high contrast
- **Audience:** colleagues in their 60s–80s, mostly on phones — familiarity beats novelty

## Structure

- **Nav:** one top bar (wordmark · links · share · account menu) on desktop; a fixed bottom
  tab bar with icons *and* permanent labels on mobile. Five destinations, never six.
- **Footer:** single quiet band, hidden on messaging.
- **Home:** Ecosystem Index — invitation, then what is new (stories, photographs, people).
- **Story pages:** Long Document in Geist Sans, 45–75ch measure, no drop cap.
- **Person cards:** a restrained nod to IITA-era stationery — hairline rules and mono meta.
  No invented inventory codes, no placeholder stations: missing data is omitted, not filled.
- **Joke themes** (Typewriter / 1994): opt-in from Settings only. Their markup lives in
  `ThemeChrome.tsx` and renders only when the theme is switched on — never in the default DOM.

## Tokens

| Token | Value |
| --- | --- |
| `--color-paper` / `-2` / `-3` | `#f7f7f4` · `#efeee9` · `#e6e5df` |
| `--color-ink` / `-soft` / `-faint` | `#26251e` · `#4a4840` · `#6e6b62` |
| `--color-rule` | `#d9d7ce` |
| `--color-accent` | leaf `#3d5c45` — quiet links and unread marks; ink for primary actions |
| `--color-danger` | `#8f2d20` |
| `--font-*` | Geist Sans everywhere; Geist Mono for rails, meta, timestamps and counts |
| `--radius-sm/md/lg` | `0.375rem` · `0.625rem` · `1rem` |
| `--dur-fast/base/slow` | `120ms` · `180ms` · `240ms` |

## Type rules

- Sans-only · bold display · tight tracking · body ≥ 17px, never below 15px
- Headings always roman — no italic headings, no italic emphasis inside one
- Solid ink primary buttons · outlined secondary · no purple, no serif magazine vibe
- Mono is an outlier register: labels, dates, counts. Never body copy.

## Interaction rules

- Every interactive element implements all eight states: default, hover, focus-visible,
  active, disabled, loading, error, success.
- Focus rings appear instantly and are never animated. Tap targets ≥ 44px.
- Animate `transform` and `opacity` only, 120–240ms, on the named easings. Honour
  `prefers-reduced-motion`.
- Loading is a skeleton shaped like the content, not a centred "Loading…".
- Errors say what happened and what to do next — no exclamation marks, no blame.
- Empty states name what is missing and offer the action that fills it.

## Voice

- One community of people who were there — not staff vs family product lanes
- Wonderful, funny, unforgettable compound stories; science is context, not the victory lap
- World Food Prize without Nobel lectures
- CTAs like "Share a story from the compound" — warm, not corporate
- **Honest copy:** never invent a count, a statistic, or a placeholder person. Real data, or
  nothing.
