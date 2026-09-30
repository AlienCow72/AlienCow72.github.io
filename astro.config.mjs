import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aliencow72.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  server: {
    allowedHosts: ['kys-m2-macbook-pro.tail5e62a5.ts.net'],
  },
  devToolbar: { enabled: false },
});
