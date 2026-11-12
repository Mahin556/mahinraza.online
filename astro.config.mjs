import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.mahinraza.online',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap(),
  ],
  build: {
    format: 'directory',
  },
});
