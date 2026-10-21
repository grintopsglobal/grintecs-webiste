import { ui, defaultLang, locales, type Lang, type UIKey } from './ui';
import { withBase, stripBase } from '../lib/url';

export function isLang(value: string | undefined): value is Lang {
  return !!value && (locales as string[]).includes(value);
}

export function getLangFromUrl(url: URL): Lang {
  const [, seg] = stripBase(url.pathname).split('/');
  return isLang(seg) ? seg : defaultLang;
}

export function useTranslations(lang: Lang) {
  return (key: UIKey) => ui[lang][key] ?? ui[defaultLang][key];
}

/** "/services/" + "en" -> "/REPO/en/services/" */
export function localizePath(lang: Lang, path = '/'): string {
  const clean = path.replace(/^\/+/, '');
  const withSlash = clean === '' || clean.endsWith('/') || clean.includes('#') ? clean : `${clean}/`;
  return withBase(`/${lang}/${withSlash}`);
}

/** Path halaman saat ini tanpa base dan prefix bahasa, mis. "/services/erp-implementation/". */
export function pathWithoutLang(url: URL): string {
  const p = stripBase(url.pathname);
  const rest = p.replace(/^\/(id|en)(?=\/|$)/, '');
  return rest || '/';
}

export const staticLangPaths = () => locales.map((lang) => ({ params: { lang } }));
