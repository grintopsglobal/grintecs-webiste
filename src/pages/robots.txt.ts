import type { APIRoute } from 'astro';
import { withBase } from '../lib/url';

// Catatan: crawler hanya membaca robots.txt di root domain. Untuk project site GitHub Pages
// (OWNER.github.io/REPO/) file ini baru efektif setelah pindah ke custom domain.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: ${withBase('/admin/')}\n\nSitemap: ${new URL(withBase('/sitemap.xml'), site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
