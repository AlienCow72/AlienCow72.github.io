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
];
