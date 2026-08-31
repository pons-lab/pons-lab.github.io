// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: `site` must match the final public address of the site.
// While the GitHub repository is named `<account>.github.io`, the address is
// `https://<account>.github.io/` and no `base` path is needed. Update this one
// line when the account name is decided or when the yonsei.ac.kr subdomain is
// connected — sitemap.xml, robots.txt and the Open Graph tags all read from it.
export default defineConfig({
  site: 'https://pons-lab.github.io',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ko: 'ko' } },
      // 구성원 전용 안내 페이지는 색인 대상이 아니다 (BaseLayout 의 noindex 와 짝)
      filter: (page) => !/\/members\/?$/.test(new URL(page).pathname),
    }),
  ],
  // 예전 /publications 주소로 들어오는 링크가 깨지지 않게 저널 페이지로 넘긴다
  redirects: {
    '/publications': '/publications/journal',
    '/ko/publications': '/ko/publications/journal',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
});
