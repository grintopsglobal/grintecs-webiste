// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages (project site): https://OWNER.github.io/REPO/
// Jika repo bernama OWNER.github.io atau memakai custom domain:
// ubah `site` ke domain tersebut, hapus `base`, dan buat public/CNAME.
const SITE = 'https://grintopsglobal.github.io';
const BASE = '/grintecs-webiste';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  output: 'static',
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'id', locales: { id: 'id-ID', en: 'en-US' } },
      filter: (page) => /\/(id|en)\//.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
