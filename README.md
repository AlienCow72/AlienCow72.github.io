# Kyle Anderson — personal website

A static Astro website for writing, projects, and **KMA consultant**. Charcoal, warm gold, editorial typography, and an interactive Canvas signal field inspired by code, music, and AI.

## Develop

Requires Node.js **24 or newer**.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321`. To inspect the production output, run `npm run build`, then `npm run preview`.

```sh
npm run lint          # ESLint for Astro, TypeScript, and JavaScript
npm run prettier      # Formatting check
npm run build         # Astro type/content checks + static production build
npm run prettier:fix  # Apply formatting
```

## Edit the site

| Content                                            | Location                     |
| -------------------------------------------------- | ---------------------------- |
| Name, email, business name, social links, projects | `src/data/site.ts`           |
| Homepage                                           | `src/pages/index.astro`      |
| Consulting services                                | `src/pages/consulting.astro` |
| Writing                                            | `src/content/blog/`          |
| Colors, layout, responsive styles                  | `src/styles/global.css`      |
| Interactive hero                                   | `src/scripts/signal.ts`      |
| Metadata, navigation, footer                       | `src/layouts/Layout.astro`   |

The two professional project summaries come from the previous repository’s supplied portfolio content. The third project describes this site. Contact buttons open an email draft using the existing portfolio email; there is no form service or backend.

### Add a blog post

Create `src/content/blog/your-post-slug.md`:

```markdown
---
title: 'Your article title'
description: 'A short introduction for the article card and metadata.'
date: 2026-09-29
category: Coding
readTime: 4 min
sample: false
draft: false
---

Your Markdown content goes here.
```

Supported topics are `Coding`, `Music`, and `AI`. Extend the enum in `src/content.config.ts`, the topic buttons in `src/pages/blog/index.astro`, and icons in `src/components/PostCard.astro` when adding another category. Articles sort newest first. Reading time is an editorial field, not an automatic estimate.

**The three included articles are labeled samples.** Replace or remove them before publishing your own writing. `sample: true` keeps the label visible and excludes the article from RSS. `draft: true` excludes a post from listings, page generation, and RSS. The RSS feed is empty until a non-sample, non-draft post is added.

Search and topic filtering work together in the browser. With JavaScript disabled, all published article links remain available.

### Playlists in music posts

Add the public Apple Music playlist URL to a post’s frontmatter:

```yaml
category: Music
playlist: https://music.apple.com/us/playlist/vibes-2026/pl.u-NJG4Fmx6YPL
playlistOrder: newest-last
playlistLayout: grid
playlistLimit: 10
```

The latest songs appear below the article, newest first.

`playlistLimit` sets the number of songs in either layout (an integer from 1 to 100; defaults to 10). `playlistLayout: grid` shows square artwork with three rows underneath: title, artist, and provider icons. `playlistLayout: list` (the default) shows compact rows with the provider icons on the right; on narrow screens they form a two-by-two block beside the title and artist. For example, use `playlistLayout: list` and `playlistLimit: 6` for a six-song list.

`playlistOrder: newest-last` matches playlists where new songs are appended at the bottom. Use `newest-first` if you maintain new additions at the top. **Apple’s public playlist data does not provide a date added for each song.** Reordering the playlist changes what is shown; this uses saved playlist order, not release dates or historical addition timestamps. If the playlist contains fewer songs than the requested limit, the full list is shown. The existing sample music article demonstrates Vibes 2026 and retains its sample label.

The list is generated at build time, works without JavaScript, and requires no visitor login. The deployment workflow rebuilds daily at 11:23 UTC (GitHub schedules can be delayed), on pushes to main, and via **Run workflow**. Local development refreshes on restarting the dev server. No background requests are sent by visitors. If Apple fails or returns incomplete data, the article still builds with a message and the full playlist link; a subsequent successful build restores the songs.

#### Official API credentials

Copy `.env.example` to `.env` for local development. In GitHub, add repository **Actions secrets** with the same names:

- `APPLE_MUSIC_DEVELOPER_TOKEN`: a signed Apple Music developer JWT. Follow [Apple’s developer token instructions](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens). Renew it before expiration. When set, builds use the [Apple Music catalog playlist API](https://developer.apple.com/documentation/applemusicapi/get-a-catalog-playlist) and follow all track pages before selecting the requested songs. Without it, builds parse the public playlist webpage and verify its track count; that fallback may need maintenance if Apple changes its page format.
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`: credentials for a Spotify app. Builds obtain a token through [client credentials authorization](https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow) and use [catalog search](https://developer.spotify.com/documentation/web-api/reference/search). A direct link is included only when title, primary artist, and duration match. Spotify app access restrictions or rate limits may prevent matching.

Credentials stay on the build machine; do not prefix them with `PUBLIC_`. No Songlink dependency is used. Apple Music always links directly to the song. Without credentials, on API errors, or when no confident match exists, the Spotify icon opens a search and has a **Search Spotify** tooltip and accessible label. YouTube and SoundCloud icons have search tooltips and accessible labels; these do not claim an exact recording match.

Provider icons are bundled SVGs from [Simple Icons](https://github.com/simple-icons/simple-icons) (CC0); no external icon requests are needed. Spotify searches use its path-based web search URL.

Run `npm run test:music` for configurable track selection, the recorded public playlist fixture, API pagination, URL validation, Spotify matching, and failure behavior. These tests mock authenticated API responses; real authenticated integration requires the credentials above.

### Motion and accessibility

The hero has Code, Music, and AI modes plus a pause/play button. Pointer movement rotates the sculpture. Reduced motion starts it paused; visitors can explicitly opt into motion. Rendering stops when the canvas is offscreen or the tab is hidden. Navigation and controls are keyboard accessible, and the layout adapts to narrow screens. Fonts are bundled locally.

## GitHub Pages

This repository’s remote is `AlienCow72/AlienCow72.github.io`, so `astro.config.mjs` uses:

```js
site: 'https://aliencow72.github.io',
base: '/',
```

1. Set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push or merge changes into `main`.
3. The deploy workflow installs locked dependencies, runs all checks, builds `dist/`, and publishes it to Pages. Pull requests run the same validation without deploying.

See the [official Astro GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/).

For a custom domain, update `site`, `public/robots.txt`, and the GitHub Pages domain setting; add `public/CNAME` if needed. For a project repository under a URL subpath, also update root-relative links and asset URLs throughout the site along with `base`. This implementation targets the current root-domain repository.

`public/sw.js` retires the previous portfolio’s service worker when an existing browser checks for an update.

No GitHub API calls, runtime tokens, database, analytics, or external font requests are required. `dist/` and `.astro/` are generated and ignored. The previous GitProfile source remains available in Git history; its original MIT license is retained in `LICENSE`.

## Personal brand mark

`src/assets/brand/personal-mark.svg` is a true vector trace of the supplied transparent image. The original is retained alongside it as `personal-mark-source.png`. It has a transparent background, a padded viewBox, and uses `currentColor` for its default solid fill.

Use `src/components/BrandMark.astro` for inline, configurable rendering:

```astro
---
import BrandMark from './components/BrandMark.astro';
---

<BrandMark color="black" />
<BrandMark color="white" />
<BrandMark variant="outline" color="#e4bc78" strokeWidth={2} size={64} />
<BrandMark fill="black" stroke="white" strokeWidth={2} size={64} />
```

The component defaults to a solid mark inheriting the surrounding text color. Set `fill` and `stroke` independently for a filled mark with a contrasting outline; `variant="outline"` leaves the silhouette unfilled and strokes its contours. `strokeWidth` is in SVG viewBox units and scales with the icon. Use modest widths to preserve the narrow spaces in the design.

The header home link uses the mark in the site's near-white text color (44px on desktop, 34px on mobile). The component is decorative, so a containing link or button should provide its accessible name, as the header's “Kyle Anderson home” link does. For direct SVG use, import the asset as an Astro component and override its root `fill`, `stroke`, or `color` attributes. CSS color does not cross an external `<img>` boundary; use an inline SVG for contextual colors.
