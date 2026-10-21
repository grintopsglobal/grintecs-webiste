const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Tambahkan base path GitHub Pages ke path internal; URL eksternal, mailto:, tel:, dan #anchor dibiarkan. */
export function withBase(path: string | undefined | null): string {
  if (!path) return '';
  if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) return p;
  return BASE + p;
}

/** Hapus base path, dipakai untuk memetakan URL halaman saat ini ke bahasa lain. */
export function stripBase(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}

/** Body markdown dari CMS berisi path "/uploads/..." tanpa base; tambahkan base saat render. */
export function bodyHtml(entry: { rendered?: { html: string } }): string {
  return (entry.rendered?.html ?? '').replace(/(src|href)="\/uploads\//g, `$1="${BASE}/uploads/`);
}
