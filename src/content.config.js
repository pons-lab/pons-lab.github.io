import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 뉴스: src/content/news/ 안의 .md 파일 하나가 뉴스 한 건입니다.
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    title_ko: z.string(),
    date: z.date(),
    tag: z.string().optional(),
    tag_ko: z.string().optional(),
    summary: z.string(),
    summary_ko: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { news };
