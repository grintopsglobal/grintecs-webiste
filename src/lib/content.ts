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

/** Kunci pasangan terjemahan = nama file tanpa bahasa, mis. "erp-implementation". Slug boleh beda per bahasa. */
export const keyOf = (entry: { id: string }) => entry.id.replace(/^[a-z]{2}\//, '');

/** Cari entry berdasarkan kunci file; nilai lama yang menyimpan slug tetap dikenali. */
export function findByKey<T extends { id: string; data: { slug: string } }>(items: T[], key: string) {
  return items.find((e) => keyOf(e) === key || e.data.slug === key);
}

/**
 * Path padanan untuk language switcher / hreflang, dipasangkan lewat kunci file.
 * Jika terjemahan belum ada, arahkan ke halaman listing bahasa tersebut agar tidak 404.
 */
export async function alternatesFor(collection: 'services' | 'solutions' | 'industries' | 'insights', key: string) {
  const all = await getCollection(collection);
  const pick = (lang: Lang) => {
    const entry = all.find((e) => e.id === `${lang}/${key}`);
    return entry ? `/${collection}/${entry.data.slug}/` : `/${collection}/`;
  };
  return { id: pick('id'), en: pick('en') } satisfies Record<Lang, string>;
}

/** Layanan induk sebuah sub-layanan di bahasa yang sama. Slug boleh beda per bahasa, jadi dicari lewat kunci file. */
export async function parentOf(lang: Lang, entry: CollectionEntry<'subservices'>) {
  const parent = findByKey(await byLang('services', lang), entry.data.parent);
  if (!parent) throw new Error(`Layanan induk "${entry.data.parent}" untuk sub-layanan "${entry.id}" tidak ditemukan.`);
  return parent;
}
