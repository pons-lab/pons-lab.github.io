import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';

const dataDir = path.resolve(process.cwd(), 'src/data');
const read = (file) => load(fs.readFileSync(path.join(dataDir, file), 'utf8'));

export const site = read('site.yaml');
export const members = read('members.yaml');
export const publications = read('publications.yaml');
export const lectures = read('lectures.yaml');
export const research = read('research.yaml');
export const gallery = read('gallery.yaml');

/** 저널 논문을 연도별로 묶어 최신순으로 돌려준다. 미출판 논문은 맨 앞의 별도 그룹. */
export function journalsByYear() {
  const all = [...publications.journals].sort((a, b) => b.id - a.id);
  const unpublished = all.filter((p) => !p.year);
  const published = all.filter((p) => p.year);

  const years = [...new Set(published.map((p) => p.year))].sort((a, b) => b - a);
  const groups = years.map((year) => ({
    year,
    items: published.filter((p) => p.year === year),
  }));

  return { unpublished, groups };
}

/** 학회 발표를 international / domestic 으로 나눠 최신순으로 돌려준다. */
export function conferencesByScope() {
  const sorted = (scope) =>
    publications.conferences.filter((c) => c.scope === scope).sort((a, b) => b.year - a.year);
  return { international: sorted('international'), domestic: sorted('domestic') };
}

/** 메인 페이지 Selected Publications 용 — 출판된 논문 중 최신 n편. */
export function selectedPublications(n = 3) {
  return [...publications.journals]
    .filter((p) => p.year)
    .sort((a, b) => b.id - a.id)
    .slice(0, n);
}

export const doiUrl = (doi) => (doi ? `https://doi.org/${doi}` : null);
