// Kategori Insights. Jika menambah kategori: tambahkan di sini, di src/i18n/ui.ts (label "cat.*"),
// dan di opsi widget select pada public/admin/config.yml.
export const CATEGORIES = ['ai', 'engineering', 'data', 'security', 'transformation'] as const;
export type Category = (typeof CATEGORIES)[number];
