import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

type Ordered = 'services' | 'subservices' | 'solutions' | 'industries';

export async function byLang<C extends Ordered>(collection: C, lang: Lang) {
  const items = (await getCollection(collection, (e) => e.id.startsWith(`${lang}/`))) as CollectionEntry<C>[];
  return items.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function insightsByLang(lang: Lang) {
  const items = await getCollection('insights', (e) => e.id.startsWith(`${lang}/`) && !e.data.draft);
  return items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

type PageData = CollectionEntry<'pages'>['data'];

export async function getPage<T extends PageData['type']>(lang: Lang, type: T) {
  const entry = await getEntry('pages', `${lang}/${type}`);
  if (!entry || entry.data.type !== type) throw new Error(`Konten halaman "${lang}/${type}" tidak ditemukan.`);
  return entry.data as Extract<PageData, { type: T }>;
}

export async function getSettings(lang: Lang) {
  const entry = await getEntry('settings', `${lang}/site`);
  if (!entry) throw new Error(`Pengaturan situs "${lang}/site" tidak ditemukan.`);
  return entry.data;
}

/**
 * Path padanan untuk language switcher / hreflang. Jika terjemahan belum ada,
 * arahkan ke halaman listing bahasa tersebut agar tidak 404.
 */
export async function alternatesFor(collection: 'services' | 'solutions' | 'industries' | 'insights', slug: string) {
  const all = await getCollection(collection);
  const has = (lang: Lang) => all.some((e) => e.id.startsWith(`${lang}/`) && e.data.slug === slug);
  const pick = (lang: Lang) => (has(lang) ? `/${collection}/${slug}/` : `/${collection}/`);
  return { id: pick('id'), en: pick('en') } satisfies Record<Lang, string>;
}
