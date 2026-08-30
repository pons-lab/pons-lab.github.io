/**
 * 실적 엑셀 내보내기.
 *
 *   npm run export
 *
 * 사이트 데이터(src/data/*.yaml)를 그대로 읽어 시트별로 정리한 엑셀을
 * _exports/ 에 만든다. 개인용 파일이므로 git 에도 사이트에도 올라가지 않는다
 * (.gitignore 에 _exports/ 가 들어 있다).
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

// js-yaml v5 · exceljs 는 CommonJS 라 require 로 불러온다.
const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const ExcelJS = require('exceljs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => yaml.load(readFileSync(path.join(root, 'src/data', name), 'utf8'));

const publications = load('publications.yaml');
const cv = load('cv.yaml');
const research = load('research.yaml');
const members = load('members.yaml');

/** 2026.05 처럼 저장된 연·월 숫자를 "2026.05" 문자열로 되돌린다. */
const ym = (v) => (typeof v === 'number' ? v.toFixed(2) : (v ?? ''));

const statusLabel = {
  'in-preparation': '준비 중',
  'in-revision': '심사 중',
  'in-press': '게재 예정',
  accepted: '게재 확정',
};

// ── 시트 만들기 ──────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'PONS Lab website';
wb.created = new Date();

/** columns: [제목, 너비, 값 뽑는 함수] */
function sheet(name, columns, rows) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map(([header, width]) => ({ header, width }));

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2153C4' } };
  ws.getRow(1).alignment = { vertical: 'middle' };
  ws.getRow(1).height = 22;

  rows.forEach((item, i) => {
    const row = ws.addRow(columns.map(([, , get]) => get(item, i)));
    row.alignment = { vertical: 'top', wrapText: true };
  });

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}

// 1. 저널 논문 — 사이트와 같은 순서(최신 우선)
sheet(
  '저널 논문',
  [
    ['번호', 6, (p) => p.id],
    ['연도', 8, (p) => p.year ?? statusLabel[p.status] ?? ''],
    ['저자', 40, (p) => p.authors],
    ['제목', 60, (p) => p.title],
    ['저널', 34, (p) => p.venue],
    ['권/호/페이지', 20, (p) => p.detail],
    ['DOI', 30, (p) => p.doi],
    ['대표논문', 10, (p) => (p.featured ? 'O' : '')],
  ],
  [...publications.journals].sort((a, b) => b.id - a.id)
);

// 2. 학회 발표
sheet(
  '학회 발표',
  [
    ['구분', 10, (c) => (c.scope === 'international' ? '국제' : '국내')],
    ['발표형태', 10, (c) => (c.format === 'oral' ? '구두' : '포스터')],
    ['연도', 8, (c) => c.year],
    ['저자', 40, (c) => c.authors],
    ['제목', 60, (c) => c.title],
    ['학회', 44, (c) => c.venue],
    ['장소', 22, (c) => c.place ?? ''],
    ['일자', 22, (c) => c.date ?? ''],
  ],
  [...publications.conferences].sort(
    (a, b) => a.scope.localeCompare(b.scope) || b.year - a.year
  )
);

// 3. 특허
sheet(
  '특허',
  [
    ['번호', 6, (p) => p.no],
    ['상태', 8, (p) => (p.status === 'granted' ? '등록' : '출원')],
    ['발명자', 38, (p) => p.inventors],
    ['명칭(국문)', 50, (p) => p.title_ko],
    ['명칭(영문)', 50, (p) => p.title_en],
    ['등록/공개번호', 20, (p) => p.number],
    ['일자', 13, (p) => p.date],
    ['출원번호', 18, (p) => p.application_number ?? ''],
    ['출원일', 13, (p) => p.application_date ?? ''],
    ['국가', 10, (p) => p.country_ko],
    ['출원인', 26, (p) => p.assignee_ko ?? ''],
  ],
  [...cv.patents].sort((a, b) => b.no - a.no)
);

// 4. 연구과제 — 진행 중(research.yaml) + 종료(cv.yaml)
sheet(
  '연구과제',
  [
    ['구분', 10, (p) => p.kind],
    ['기간', 20, (p) => p.period],
    ['과제명(국문)', 50, (p) => p.title_ko],
    ['과제명(영문)', 50, (p) => p.title_en],
    ['지원기관', 30, (p) => p.funder_ko ?? ''],
    ['역할', 14, (p) => p.role_label],
  ],
  [
    ...research.projects.map((p) => ({
      ...p,
      kind: '진행 중',
      role_label: p.role === 'pi' ? '연구책임자' : '참여연구원',
    })),
    ...cv.past_projects.map((p) => ({ ...p, kind: '종료', role_label: p.role_ko })),
  ]
);

// 5. 수상
sheet(
  '수상',
  [
    ['연월', 10, (a) => ym(a.year)],
    ['수상명(국문)', 30, (a) => a.title_ko],
    ['수상명(영문)', 30, (a) => a.title_en],
    ['수여기관(국문)', 40, (a) => a.org_ko],
    ['수여기관(영문)', 44, (a) => a.org_en],
    ['비고', 40, (a) => a.advisee_ko ?? ''],
  ],
  [...members.pi.awards].sort((a, b) => (a.year > b.year ? -1 : 1))
);

// ── 저장 ────────────────────────────────────────────────────────────────
const outDir = path.join(root, '_exports');
mkdirSync(outDir, { recursive: true });

const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD (로컬 시간)
const outFile = path.join(outDir, `PONS-Lab-실적_${today}.xlsx`);
await wb.xlsx.writeFile(outFile);

console.log('\n실적 엑셀을 만들었습니다.\n');
console.log(`  ${outFile}\n`);
for (const ws of wb.worksheets) {
  console.log(`  · ${ws.name.padEnd(6, ' ')} ${ws.rowCount - 1}건`);
}
console.log('\n이 파일은 git 에 올라가지 않습니다 (_exports/ 는 .gitignore 처리).\n');
