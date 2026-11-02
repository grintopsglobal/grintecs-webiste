// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Custom domain (public/CNAME). Untuk kembali ke project site GitHub Pages:
// SITE = 'https://grintopsglobal.github.io', tambahkan `base: '/grintecs-webiste'`, dan hapus public/CNAME.
const SITE = 'https://grintecs.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static',
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // Tanpa opsi i18n: hreflang di sitemap mengasumsikan path yang sama di semua bahasa,
      // padahal slug boleh beda per bahasa. hreflang tetap ada di <head> tiap halaman (SEO.astro).
      filter: (page) => /\/(id|en)\//.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
