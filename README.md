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
