# biologicalcontrol.org — design system

Locked visual system for the IITA Biological Control Folklore archive.

## Brand

- **Domain:** biologicalcontrol.org
- **Concept:** folklore.org archive + community gathering place for everyone who lived the IITA Biological Control Programme — staff **and** family (warm, large type, clear CTAs)
- **Reading feel:** Cursor product UI — sharp sans, generous space, high contrast
- **Chrome feel:** Cursor warm beige paper (`#f7f7f4`) + Geist
- **Person cards:** IITA-era business-card placeholders (cream stock, hairline rules, mono inventory codes, station/years) — not LinkedIn cards

## Genre & structure

- **Genre:** modern-minimal (Cursor identity), archival content
- **Home macrostructure:** Ecosystem Index (featured / people / galleries rails)
- **Story pages:** Long Document in **Geist Sans** (no serif, no drop cap)
- **Nav:** N6 masthead (domain + title + links + Contribute)
- **Footer:** Ft1 mast-headed statement

## Tokens

| Token | Value |
| --- | --- |
| `--color-paper` | `#f7f7f4` |
| `--color-paper-2` | `#efeee9` |
| `--color-ink` | `#26251e` |
| `--color-accent` | `#3d5c45` (leaf / field) |
| `--font-ui` / `--font-display` / `--font-body` | **Geist Sans** (everywhere) |
| `--font-mono` | Geist Mono (meta / inventory / rail labels only) |

## Type rules

- **Sans-only** — no Newsreader / Georgia / literary serif
- Big bold headlines (`story-title`), confident negative tracking
- Solid ink primary CTAs; hairline rules; older-eyes friendly base ≥ ~18px
- Avoid purple gradients, soft “literary magazine” vibes

## Voice

- **Community first, science second on marketing surfaces** — homepage, nav, contribute, join, footer lead with oral history and belonging, not impact metrics or self-congratulation
- Inclusive cast: colleagues, partners, spouses, kids who grew up on station, national-programme friends — not “veterans only”
- Human, messy, funny, affectionate — folklore tone; one light compound joke is fine; the whole site is not a gag reel
- Prefer stories over achievements; programme page may explain the science calmly and cite published awards carefully, without victory-lap framing
- Prefer World Food Prize / Right Livelihood (accurate) over casual “Nobel”
- CTAs like “Share a story from the compound” / “Families welcome” — warm, not corporate

## Content model (Sanity)

- `story` · `person` · `gallery` · `themeTag` · `programme` (singleton) · `siteSettings` (singleton)
