# biologicalcontrol.org — design system

Locked visual system for the IITA Biological Control folklore archive.
Adapted from the story reader (Making Software–inspired).

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
- **Identity:** Newsreader for display and long-form, Geist Sans for UI, Geist Mono for rails —
  cool gray paper, black ink, cobalt accent
- **Audience:** colleagues in their 60s–80s, mostly on phones — familiarity beats novelty

## Structure

- **Nav:** one top bar (wordmark · links · share · account menu) on desktop; a fixed bottom
  tab bar with icons *and* permanent labels on mobile. Five destinations, never six.
- **Footer:** single quiet band, hidden on messaging.
- **Home:** Ecosystem Index — invitation, then what is new (stories, photographs, people).
- **Story pages:** book reader — Newsreader prose, paper sheet on gray, reading ruler, TOC drawer.
- **Person cards:** restrained — hairline rules and mono meta. Missing data is omitted, not filled.

## Tokens

| Token | Value |
| --- | --- |
| `--color-paper` / `-2` / `-3` | `#f5f5f5` · `#fbfbfb` · `#eeeeee` |
| `--color-surface` | `#ffffff` — raised paper sheets |
| `--color-ink` / `-soft` / `-faint` | `#000000` · `#374151` · `color-mix(#000 50%)` |
| `--color-rule` | `color-mix(#000 10%)` |
| `--color-accent` | cobalt `#103cfe` — links, focus, unread |
| `--color-sky` | `#00bbfe` — prose link underlines |
| `--color-danger` | `#8f2d20` |
| `--font-display` / body editorial | Newsreader |
| `--font-ui` | Geist Sans |
| `--font-mono` | Geist Mono — rails, meta, timestamps, counts |
| `--radius-sm/md/lg` | `0.125rem` · `0.25rem` · `0.5rem` |
| `--dur-fast/base/slow` | `120ms` · `180ms` · `240ms` |

## Type rules

- Display and story prose in Newsreader · UI chrome in Geist Sans · mono for meta only
- Headings roman — no italic headings
- Solid ink primary buttons · outlined secondary · cobalt for links and focus
- Mono is an outlier register: labels, dates, counts. Never body copy.
- Body UI ≥ 16px; story prose follows the reader measure (~15px justified on desktop)

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
