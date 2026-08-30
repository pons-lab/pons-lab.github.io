import { load } from 'js-yaml';

// yaml 파일을 문자열로 불러와 파싱한다.
// `?raw` 로 불러오면 개발 서버가 파일 변경을 감지해, yaml 을 저장하는 즉시
// 브라우저에 반영된다. (fs.readFileSync 로 읽으면 서버를 껐다 켜야 한다.)
import siteYaml from '../data/site.yaml?raw';
import membersYaml from '../data/members.yaml?raw';
import publicationsYaml from '../data/publications.yaml?raw';
import lecturesYaml from '../data/lectures.yaml?raw';
import researchYaml from '../data/research.yaml?raw';
import galleryYaml from '../data/gallery.yaml?raw';

export const site = load(siteYaml);
export const members = load(membersYaml);
export const publications = load(publicationsYaml);
export const lectures = load(lecturesYaml);
export const research = load(researchYaml);
export const gallery = load(galleryYaml);

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

/** 논문 번호로 한 편을 찾는다. research.yaml 의 refs 에서 쓴다. */
export const paperById = (id) => publications.journals.find((p) => p.id === id) ?? null;

export const doiUrl = (doi) => (doi ? `https://doi.org/${doi}` : null);
