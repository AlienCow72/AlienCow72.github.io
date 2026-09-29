# AGENTS.md

## Project

Kyle Anderson’s personal website, built with Astro and TypeScript. Static output is deployed to GitHub Pages at `https://aliencow72.github.io/`. The previous GitProfile application has been replaced at the owner’s request.

## Content and structure

- `src/data/site.ts`: identity, contact links, consulting name (KMA consultant), and project descriptions.
- `src/content/blog/*.md`: blog posts, validated in `src/content.config.ts`.
- `src/pages/`: homepage, writing, projects, consulting, RSS, and 404 routes.
- `src/layouts/Layout.astro`: shared navigation, metadata, fonts, and footer.
- `src/components/`: reusable presentation and the interactive signal field.
- `src/styles/global.css`: responsive styles and design tokens.
- `src/scripts/signal.ts`: dependency-free Canvas animation.

Keep professional claims grounded in the owner’s supplied material. Do not invent clients, testimonials, metrics, or business credentials. Sample blog articles must stay visibly labeled until replaced or approved. `draft: true` excludes a post from all generated routes and the feed; `sample: true` labels it on-site and excludes it from RSS.

## Commands

Node.js 24+ is required. Use `npm ci`, then `npm run dev` (port 4321). Before finishing, run `npm run lint`, `npm run prettier`, and `npm run build`. Build runs Astro’s type/content checks before generating the site. Use `npm run prettier:fix` to format.

For UI changes, check desktop and narrow mobile layouts, links, interactive controls, keyboard access, and reduced-motion behavior. There is no automated test suite; report the checks actually performed.

## Deployment

`.github/workflows/deploy.yml` validates, builds, and deploys on pushes to `main`. GitHub Pages Source must be GitHub Actions. `astro.config.mjs` uses `base: '/'` for this user-site repository. Internal links are root-relative. Moving to a project subpath requires updating links and assets as well as Astro’s base. Never commit `dist/`, `.astro/`, or `node_modules/`.

## Conventions

Use semantic Astro components, TypeScript, CSS custom properties, and self-hosted fonts. Preserve the charcoal/gold palette and serif/sans typography. Keep animation optional, pause it when offscreen, and respect reduced motion. Do not add a client framework or backend without a concrete need.
