import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    return !l || l === defaultLang ? path : `/${l}${path}`;
  }
}

export function getRouteFromUrl(url: URL, newLang: string) {
  const [, lang, ...rest] = url.pathname.split('/');
  const path = rest.join('/');
  return `/${newLang}/${path}${url.search}`;
}
