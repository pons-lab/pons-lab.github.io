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
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', ko: 'ko' } } })],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ko'],
    routing: { prefixDefaultLocale: false },
  },
});
