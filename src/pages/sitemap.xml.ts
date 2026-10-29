import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

// @astrojs/sitemap menghasilkan sitemap-index.xml, tapi Search Console dan banyak tool
// mengetik /sitemap.xml. Endpoint ini menyajikan sitemap index yang sama di nama lazim itu.
// Integrasi baru memecah file (sitemap-1.xml dst.) di atas 45.000 URL, jadi satu entri cukup.
export const GET: APIRoute = ({ site }) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${new URL(withBase('/sitemap-0.xml'), site).href}</loc></sitemap></sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
