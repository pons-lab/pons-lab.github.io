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
    // 상장·증명서 등 첨부 문서. public/docs/ 에 파일을 넣고 /docs/파일명 으로 적습니다.
    file: z.string().optional(),
    file_label: z.string().optional(),
    file_label_ko: z.string().optional(),
  }),
});

export const collections = { news };
