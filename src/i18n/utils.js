import { ui, defaultLang } from './ui.js';

/** URL 경로에서 언어를 판별한다. /ko/... 이면 'ko', 그 외에는 'en'. */
export function getLangFromUrl(url) {
  const [, lang] = url.pathname.split('/');
  return lang in ui ? lang : defaultLang;
}

/** t('nav.home') 형태로 UI 문자열을 꺼내 쓰는 함수를 만든다. */
export function useTranslations(lang) {
  return function t(key) {
    return ui[lang]?.[key] ?? ui[defaultLang][key] ?? key;
  };
}

/** 영문 기준 경로를 현재 언어의 경로로 바꾼다. '/research' → '/ko/research' */
export function localizePath(path, lang) {
  const clean = path === '/' ? '' : path;
  if (lang === defaultLang) return clean || '/';
  return clean ? `/${lang}${clean}` : `/${lang}/`;
}

/** 현재 페이지의 다른 언어 버전 경로를 만든다. (언어 전환 버튼용) */
export function alternatePath(pathname, targetLang) {
  const stripped = pathname.replace(/^\/ko(?=\/|$)/, '') || '/';
  const normalized = stripped.replace(/\/$/, '') || '/';
  return localizePath(normalized, targetLang);
}

/** 언어에 맞는 필드를 고른다. pick(obj, 'title', lang) → title_ko 또는 title */
export function pick(obj, field, lang) {
  if (!obj) return '';
  if (lang !== defaultLang) {
    const localized = obj[`${field}_${lang}`];
    if (localized) return localized;
  }
  return obj[`${field}_${defaultLang}`] ?? obj[field] ?? '';
}

/** yyyy-mm-dd Date 를 언어에 맞게 표시한다. */
export function formatDate(date, lang, opts = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (lang === 'ko') {
    return opts.monthOnly
      ? `${d.getFullYear()}년 ${d.getMonth() + 1}월`
      : `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  }
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: opts.monthOnly ? 'long' : 'short',
    ...(opts.monthOnly ? {} : { day: 'numeric' }),
    timeZone: 'UTC',
  });
}
