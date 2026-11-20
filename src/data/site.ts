import kmaHomeCapture from '../assets/projects/kma-chromecast/kma-home.webp';
import kmaDashboardCapture from '../assets/projects/kma-chromecast/kma-dashboard.webp';
import dataHubCapture from '../assets/projects/kma-chromecast/dashboard-data-hub.webp';
import appleBridgeCapture from '../assets/projects/kma-chromecast/apple-bridge.webp';

export const site = {
  name: 'Kyle Anderson',
  business: 'KMA Consulting',
  email: 'andersonktech@icloud.com',
  github: 'https://github.com/AlienCow72',
  linkedin: 'https://www.linkedin.com/in/kyle-anderson-mke/',
  description:
    'The personal corner of Kyle Anderson. Software, systems, music, and a healthy dose of curiosity. Explore projects, writing, and KMA consultant.',
};

export const projects = [
  {
    slug: 'dstax-connect',
    title: 'Making complex systems talk.',
    name: 'DSTaxConnect',
    category: 'Integrations & development',
    year: '01',
    art: 'integration',
    description:
      'Connecting financial platforms and tax providers through a more flexible integration platform.',
    tags: ['Python', 'Django', 'REST APIs'],
    intro:
      'From ITBridge to DSTaxConnect: evolving an integration product to support more platforms, more providers, and the people working with them.',
    sections: [
      {
        title: 'The challenge',
        text: 'ITBridge connected ERP and e-commerce applications to a tax engine. As additional tax providers approached DSTax, the product needed a foundation that could accommodate a wider range of integrations.',
      },
      {
        title: 'My contribution',
        text: 'I developed integrations across financial and commerce platforms, helped propose and build the next version of the application, and worked across technical leadership, project coordination, and customer support. The work included improving the application interface, introducing automated testing and deployment pipelines, and centralizing issue tracking and documentation.',
      },
      {
        title: 'Beyond the implementation',
        text: 'Integration work continues after the first successful API call. Requirements gathering, setup, troubleshooting, documentation, and go-live support were all part of helping customers use the platform.',
      },
    ],
  },
  {
    slug: 'connected-asset-data',
    title: 'Turning asset data into answers.',
    name: 'Joy Global / Komatsu',
    category: 'Data & automation',
    year: '02',
    art: 'data',
    description:
      'Bringing asset records, documentation, and facility information into a more useful whole.',
    tags: ['SharePoint', 'Data analysis', 'Automation'],
    intro:
      'Making industrial asset and facility information easier to find, maintain, and understand.',
    sections: [
      {
        title: 'The challenge',
        text: 'Asset records and supporting documentation needed to be reconciled with physical equipment. A spreadsheet alone made it difficult to connect those records with the information people needed.',
      },
      {
        title: 'My contribution',
        text: 'I investigated physical assets, compiled machine specifications, and moved spreadsheet records into a SharePoint database with related documentation. I also helped implement a global mapping platform for facility information and introduced web automation to reduce manual database maintenance.',
      },
      {
        title: 'A more usable system',
        text: 'Data entry forms and tailored views made records easier to maintain and interpret across departments. The work brought together on-site investigation, data analysis, and practical process improvements.',
      },
    ],
  },
  {
    slug: 'this-little-corner',
    title: 'A little corner of the internet.',
    name: 'Personal website',
    category: 'Design & development',
    year: '03',
    art: 'web',
    description:
      'An independent home for projects, ideas, and experiments. Built with Astro, made to keep evolving.',
    tags: ['Astro', 'TypeScript', 'Canvas'],
    intro:
      'A personal website with room for software, music, AI, and whatever comes next.',
    sections: [
      {
        title: 'The idea',
        text: 'Bring writing, project work, and consulting together in one independent website. A charcoal palette, warm gold accents, and editorial typography give each section a shared visual language.',
      },
      {
        title: 'How it works',
        text: 'Astro renders the pages as static HTML. Blog posts live in Markdown content collections, and a small Canvas animation adds an interactive signal field to the homepage. No database or client-side framework is needed.',
      },
      {
        title: 'Made to last',
        text: 'Self-hosted fonts, semantic HTML, keyboard controls, a motion toggle, and reduced-motion support keep the experience usable. GitHub Actions builds and publishes the static output to GitHub Pages.',
      },
    ],
  },
  {
    slug: 'resume-studio',
    title: 'One résumé. Room to adapt.',
    name: 'Résumé Studio',
    category: 'Tools & automation',
    year: '04',
    art: 'resume',
    description:
      'A local workspace for editing résumés, managing versions, and turning job postings into reviewable application drafts.',
    tags: ['Python', 'JSON Resume', 'AI-assisted workflows'],
    intro:
      'Bringing structured résumé data, document rendering, and application tracking together without losing sight of the source material.',
    sections: [
      {
        title: 'The idea',
        text: 'Updating a résumé for different opportunities can leave a trail of disconnected documents. I built Résumé Studio around one editable master, with named versions that select relevant information without duplicating the underlying facts.',
      },
      {
        title: 'From data to documents',
        text: 'A Python application serves a local browser interface for editing JSON Resume data, choosing version content, and previewing the result. Exports include JSON, Markdown, HTML, and PDF. Shared HTML and PDF layouts keep previews and downloads consistent, while revision checks and timestamped backups protect saved work.',
      },
      {
        title: 'A reviewable application workflow',
        text: 'A job tracker connects posting capture with AI-assisted résumé and cover-letter drafts through the Codex CLI. Each generation run keeps a snapshot of the master résumé and its source posting. Drafts can be reviewed and edited before downloading an application ZIP, and the board tracks progress from applying to interviews. Generated documents stay separate from the master, with human review built into the workflow.',
      },
    ],
  },
  {
    slug: 'kma-chromecast',
    title: 'A home screen for the way I use my TV.',
    name: 'KMA-Chromecast',
    category: 'TV apps & platform integrations',
    year: '05',
    art: 'chromecast',
    description:
      'A Google TV launcher and a glanceable dashboard, backed by a shared data hub and a native macOS bridge.',
    tags: ['Kotlin', 'Compose for TV', 'FastAPI', 'Swift'],
    intro: [
      'I wanted an ad-free home screen that put my most-used apps a few remote clicks away. I also wanted a dashboard I could glance at from the couch to see what was on my calendar, which reminders needed attention, and what the weather was doing.',
      'I had to figure out where each part should run. I kept the launcher and dashboard as separate Google TV apps, put calendar and reminder collection on the Mac that already had access to them, and built a shared hub in between. That gave the TV a single place to read data and let the Mac collect on its own schedule.',
      'I designed the launcher around a dock with a clear focus target for the D-pad. For the dashboard, I adapted Week Canvas into a seven-day strip with cards for today’s agenda, reminders, weather, and music. I compared HTML mockups to settle the layout, then used glass panels and selective highlights to give the information I needed next the most weight.',
    ],
    sections: [
      {
        title: 'KMA Home launcher',
        text: 'KMA Home is a Kotlin and Compose for TV app with an app dock, installed-app search, a clock, and weather. Dashboard is the first dock tile and the initial focus target. When I close Search, Weather, or All Apps, focus returns to the control I opened. The launcher has its own hub connection and shares its weather client code with KMA Dashboard.',
        image: {
          src: kmaHomeCapture,
          alt: 'KMA Home showing the date, time, weather, and seven apps in the dock',
          caption: 'KMA Home running on the living room Chromecast.',
        },
      },
      {
        title: 'KMA Dashboard',
        text: 'KMA Dashboard opens independently and lays out my week at TV scale. It highlights in-progress events and overdue reminders, wraps titles into whole rows, and shows how old the underlying observations are. The dashboard reads calendar, reminders, weather, and Codex subscription usage from the hub. Where source actions are enabled, I can request a new observation or ask the Mac to complete a specific reminder.',
        image: {
          src: kmaDashboardCapture,
          alt: 'Seven-day strip, agenda, reminders, and weather over the animated glass background',
          caption: 'The Week Canvas design prototype for KMA Dashboard.',
        },
      },
      {
        title: 'Dashboard Data Hub',
        text: 'This private FastAPI service uses Pydantic to validate versioned snapshots and SQLite to commit each snapshot together with its revision. It serves cached views to the TV and its own web dashboard. A partial or failed observation leaves the last complete snapshot and its original age intact. The hub also collects forecasts and alerts by location and queues enabled reminder actions for Apple Bridge to pick up.',
        image: {
          src: dataHubCapture,
          alt: 'Hub overview showing source status, calendar events, and reminders',
          caption: 'Dashboard Data Hub running with synthetic data.',
        },
      },
      {
        title: 'Apple Bridge',
        text: 'The Swift settings app lets me select calendars and reminder lists and check the worker’s permissions and health. An independent macOS worker reads those sources through EventKit and retries pending deliveries until the hub acknowledges them. It collects Codex quota separately. For an enabled reminder completion, the worker checks the exact item against the accepted snapshot, makes the change, and reads it back before reporting success.',
        image: {
          src: appleBridgeCapture,
          alt: 'Apple Bridge collection settings with Source mode set to Synthetic fixtures',
          caption: 'Apple Bridge collection settings in fixture preview mode.',
        },
      },
      {
        title: 'AirPlay and the Music card',
        text: 'Music takes a local path. The receiver runs on the TV and provides track metadata, cover art, and playback position for the Music card. I adapted ScreenDock to keep the first cover across different callback orders and use incoming audio timestamps to keep progress moving between position updates.',
      },
    ],
    relatedArticle: {
      href: '/blog/from-my-mac-to-my-tv/',
      label: 'Read the build story',
    },
  },
];
