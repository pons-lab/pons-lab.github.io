// 콘텐츠 자동 검사·정리.
//
//   node scripts/content-check.mjs         검사만 한다. 문제가 있으면 실패(exit 1).
//   node scripts/content-check.mjs --fix   고칠 수 있는 것은 고쳐서 파일에 쓴 뒤 검사한다.
//
// 편집 화면(Pages CMS)이나 GitHub 웹에서 사람이 직접 고친 내용이 들어오므로,
// 배포 전에 형식 실수를 걸러낸다. GitHub Actions 가 --fix 로 돌려 정리된 결과를
// 저장소에 되돌려 커밋하고, 고칠 수 없는 문제가 남으면 배포를 멈춘다.
//
// 고치는 것(형식): 앞뒤 공백, DOI 주소 → DOI, 논문 번호 누락·정렬, 사진 경로 표기,
//   "2026.1" 로 깨진 월 표기, 뉴스 국문 태그 누락, 대문자 확장자, 너무 큰 사진.
// 고치지 않는 것(사실): 이름·날짜·서지 정보. 빠졌으면 알려주기만 한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, dump } from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = process.argv.includes('--fix');
const rel = (...p) => path.join(root, ...p);
const exists = (...p) => fs.existsSync(rel(...p));

const errors = []; // 사람이 고쳐야 하는 문제 → 배포 중단
const fixed = []; // 자동으로 고친(또는 고칠 수 있는) 것
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg']; // src/lib/images.js 의 glob 과 같아야 한다
const TAG_KO = { People: '구성원', Award: '수상', Grant: '과제', Lab: '연구실', Research: '연구', Service: '학술활동' };
const STATUSES = ['in-preparation', 'in-revision', 'in-press', 'accepted'];

// ── 공통 정리 ───────────────────────────────────────────────────────────────

// 문자열 앞뒤·중복 공백을 없애고, 비어 있는 값(null)은 칸째로 지운다.
function tidy(v) {
  if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim();
  if (Array.isArray(v)) return v.filter((x) => x != null).map(tidy);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (x != null) out[k] = tidy(x);
    return out;
  }
  return v;
}

// 2026.03 을 따옴표 없이 적으면 숫자가 되어 2026.10 이 2026.1 로 깨진다. 문자열로 되돌린다.
const monthStr = (v) => (typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v);

// 사진 칸은 src/assets/ 아래 경로("people/x.jpg")로 적는다.
const assetPath = (v) => (typeof v === 'string' ? v.replace(/^\/+/, '').replace(/^src\/assets\//, '') : v);

const cleanDoi = (v) =>
  typeof v === 'string' ? v.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '') : v;

// ── 사진 파일 ───────────────────────────────────────────────────────────────

async function tidyImages(dir) {
  if (!exists(dir)) return;
  for (const name of fs.readdirSync(rel(dir), { recursive: true })) {
    let file = path.join(dir, String(name));
    if (!fs.statSync(rel(file)).isFile()) continue;
    const ext = path.extname(file).slice(1);
    const where = file.replaceAll('\\', '/');

    if (/^(heic|heif)$/i.test(ext)) {
      err(where, '아이폰 HEIC 사진은 쓸 수 없습니다. JPG 로 바꿔서 다시 올려주세요.');
      continue;
    }
    if (!IMAGE_EXT.includes(ext.toLowerCase())) {
      err(where, `사진 폴더에 넣을 수 없는 파일입니다. (${IMAGE_EXT.join(', ')} 만 가능)`);
      continue;
    }
    // 확장자가 대문자(.JPG)면 사이트가 사진을 찾지 못한다.
    if (ext !== ext.toLowerCase()) {
      fixed.push(`${where}: 확장자를 소문자로 변경`);
      if (FIX) {
        const next = file.slice(0, -ext.length) + ext.toLowerCase();
        fs.renameSync(rel(file), rel(next));
        file = next;
      }
    }
    // 휴대폰 원본처럼 너무 큰 사진은 저장소가 금방 무거워지므로 줄인다.
    if (/^jpe?g$/i.test(ext) && fs.statSync(rel(file)).size > 5 * 1024 * 1024) {
      fixed.push(`${where}: 5MB 넘는 사진을 줄임`);
      if (FIX) {
        const { default: sharp } = await import('sharp');
        const buf = await sharp(fs.readFileSync(rel(file)))
          .rotate() // 촬영 방향(EXIF)을 실제 픽셀에 반영
          .resize({ width: 3000, height: 3000, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        fs.writeFileSync(rel(file), buf);
      }
    }
  }
}

// ── YAML 데이터 파일 ────────────────────────────────────────────────────────

const data = {};

// 파일을 읽어 정리 함수를 거친 뒤, 달라졌으면 다시 쓴다.
function processYaml(name, tidyFn) {
  const file = `src/data/${name}.yaml`;
  let raw;
  try {
    raw = load(fs.readFileSync(rel(file), 'utf8'));
  } catch (e) {
    err(file, `YAML 문법 오류 — ${e.reason ?? e.message}${e.mark ? ` (${e.mark.line + 1}번째 줄)` : ''}`);
    return;
  }
  const next = tidy(raw ?? {});
  tidyFn?.(next);
  data[name] = next;
  if (JSON.stringify(next) !== JSON.stringify(raw)) {
    fixed.push(`${file}: 형식 정리`);
    if (FIX) fs.writeFileSync(rel(file), dump(next, { lineWidth: 80 }));
  }
}

const need = (where, obj, keys) => {
  for (const k of keys) if (obj[k] === undefined || obj[k] === '') err(where, `"${k}" 칸이 비어 있습니다.`);
};
const oneOf = (where, key, value, allowed) => {
  if (!allowed.includes(value)) err(where, `"${key}" 값 "${value}" 은 쓸 수 없습니다. (${allowed.join(' / ')})`);
};
const needAsset = (where, key, value) => {
  if (value && !exists('src/assets', value)) err(where, `${key} 파일이 없습니다: src/assets/${value}`);
};
const needPublic = (where, key, value) => {
  if (value && !exists('public', value)) err(where, `${key} 파일이 없습니다: public${value}`);
};

processYaml('publications', (d) => {
  const journals = d.journals ?? [];
  let max = Math.max(0, ...journals.map((p) => Number(p.id) || 0));
  for (const p of journals) {
    if (p.id === undefined || p.id === '') p.id = ++max; // 번호를 비워두면 다음 번호
    if (typeof p.id === 'string' && /^\d+$/.test(p.id)) p.id = Number(p.id);
    if (typeof p.year === 'string' && /^\d{4}$/.test(p.year)) p.year = Number(p.year);
    if (p.doi) p.doi = cleanDoi(p.doi);
  }
  journals.sort((a, b) => b.id - a.id);
});
processYaml('members', (d) => {
  for (const a of d.pi?.awards ?? []) a.year = monthStr(a.year);
  if (d.pi?.photo) d.pi.photo = assetPath(d.pi.photo);
  for (const g of d.groups ?? [])
    for (const m of g.members ?? []) {
      m.since = monthStr(m.since);
      if (m.since === undefined) delete m.since;
      if (m.photo) m.photo = assetPath(m.photo);
    }
});
processYaml('research', (d) => {
  for (const a of d.axes ?? []) {
    if (a.image) a.image = assetPath(a.image);
    for (const t of a.topics ?? []) if (t.image) t.image = assetPath(t.image);
  }
});
processYaml('gallery', (d) => {
  for (const e of d.events ?? []) if (e.folder) e.folder = assetPath(e.folder).replace(/^gallery\//, '');
});
processYaml('lectures');
processYaml('cv');
processYaml('site');

await tidyImages('src/assets/gallery');
await tidyImages('src/assets/people');

// ── 검사 ────────────────────────────────────────────────────────────────────

if (data.publications) {
  const seen = new Set();
  for (const p of data.publications.journals ?? []) {
    const w = `논문 [${p.id}]`;
    need(w, p, ['authors', 'title']);
    if (!Number.isInteger(p.id)) err(w, '번호(id)는 숫자여야 합니다.');
    if (seen.has(p.id)) err(w, '같은 번호의 논문이 두 편 있습니다.');
    seen.add(p.id);
    if (p.status) oneOf(w, 'status', p.status, STATUSES);
    if (p.year) {
      if (!Number.isInteger(p.year)) err(w, `출판 연도 "${p.year}" 는 네 자리 숫자여야 합니다.`);
      need(w, p, ['venue']);
    } else if (!p.status) err(w, '출판 연도가 없으면 상태(준비 중·심사 중·게재 확정·게재 예정)를 골라야 합니다.');
    if (p.doi && !/^10\.\d{4,9}\/\S+$/.test(p.doi)) err(w, `DOI 형식이 아닙니다: ${p.doi}`);
  }
  for (const c of data.publications.conferences ?? []) {
    const w = `학회 발표 "${String(c.title).slice(0, 30)}…"`;
    need(w, c, ['year', 'authors', 'title', 'venue']);
    oneOf(w, 'scope', c.scope, ['international', 'domestic']);
    oneOf(w, 'format', c.format, ['oral', 'poster']);
  }
}

if (data.members) {
  need('PI 프로필', data.members.pi ?? {}, ['name_en', 'name_ko']);
  needAsset('PI 프로필', '사진', data.members.pi?.photo);
  for (const a of data.members.pi?.awards ?? []) needPublic(`수상 "${a.title_ko}"`, '상장', a.file);
  for (const g of data.members.groups ?? []) {
    need('구성원 그룹', g, ['id']);
    for (const m of g.members ?? []) {
      const w = `구성원 ${m.name_en || m.name_ko || '(이름 없음)'}`;
      need(w, m, ['name_en']); // 로마자 표기는 추측하지 않는다 — 본인 표기를 받아 적는다
      needAsset(w, '사진', m.photo);
    }
  }
  for (const m of data.members.alumni ?? []) need(`알럼나이 ${m.name_ko || '(이름 없음)'}`, m, ['name_en']);
}

if (data.lectures) {
  const seen = new Set();
  for (const s of data.lectures.semesters ?? []) {
    const w = `강의 ${s.id}`;
    need(w, s, ['id', 'year', 'term_en', 'term_ko']);
    if (seen.has(s.id)) err(w, '같은 학기가 두 번 있습니다.');
    seen.add(s.id);
    for (const c of s.courses ?? []) {
      need(`${w} "${c.title_ko}"`, c, ['title_ko', 'title_en']);
      oneOf(`${w} "${c.title_ko}"`, 'level', c.level, ['undergraduate', 'graduate']);
    }
  }
}

if (data.gallery) {
  for (const e of data.gallery.events ?? []) {
    const w = `갤러리 "${e.title_ko || e.folder}"`;
    need(w, e, ['folder', 'date', 'title_en', 'title_ko']);
    if (e.date && !/^\d{4}-\d{2}$/.test(String(e.date))) err(w, `시기는 2026-10 형식으로 적습니다. (지금: ${e.date})`);
    const dir = `src/assets/gallery/${e.folder}`;
    const photos = exists(dir)
      ? fs.readdirSync(rel(dir)).filter((f) => IMAGE_EXT.includes(path.extname(f).slice(1).toLowerCase()))
      : [];
    if (e.folder && !photos.length) err(w, `사진 폴더가 없거나 비어 있습니다: ${dir}/`);
    needPublic(w, '영상', e.video);
  }
}

if (data.research) {
  const ids = new Set((data.publications?.journals ?? []).map((p) => p.id));
  for (const p of data.research.projects ?? []) {
    need(`과제 "${p.short_ko || p.title_ko}"`, p, ['period']);
    oneOf(`과제 "${p.short_ko || p.title_ko}"`, 'role', p.role, ['pi', 'researcher']);
  }
  for (const a of data.research.axes ?? []) {
    needAsset(`연구 축 "${a.title_ko}"`, '그림', a.image);
    for (const t of a.topics ?? []) {
      needAsset(`연구 주제 "${t.title_ko}"`, '그림', t.image);
      for (const r of t.refs ?? [])
        if (data.publications && !ids.has(r)) err(`연구 주제 "${t.title_ko}"`, `관련 논문 번호 [${r}] 가 논문 목록에 없습니다.`);
    }
  }
}

if (data.cv) {
  for (const p of data.cv.patents ?? []) oneOf(`특허 [${p.no}]`, 'status', p.status, ['granted', 'application']);
}

if (data.site) {
  if (!data.site.lab_authors?.length) err('site.yaml', '"lab_authors" 가 비어 있습니다.');
  need('site.yaml', data.site.name ?? {}, ['full_en', 'short_en', 'full_ko']);
}

// ── 뉴스 (파일 하나 = 글 하나, 머리말은 YAML) ───────────────────────────────

const newsFields = new Set();
for (const name of fs.readdirSync(rel('src/content/news')).filter((f) => f.endsWith('.md'))) {
  const file = `src/content/news/${name}`;
  const text = fs.readFileSync(rel(file), 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) {
    err(file, '맨 위 머리말(--- 로 둘러싼 부분)이 없습니다.');
    continue;
  }
  let raw;
  try {
    raw = load(m[1]) ?? {};
  } catch (e) {
    err(file, `머리말 YAML 문법 오류 — ${e.reason ?? e.message}`);
    continue;
  }
  const fm = tidy(raw);
  if (fm.tag && !fm.tag_ko && TAG_KO[fm.tag]) fm.tag_ko = TAG_KO[fm.tag];
  Object.keys(fm).forEach((k) => newsFields.add(k));

  // 날짜는 Date 로 읽히므로 문자열로 맞춰 비교한다.
  if (JSON.stringify(fm) !== JSON.stringify(raw)) {
    fixed.push(`${file}: 형식 정리`);
    if (FIX) {
      const out = { ...fm, date: fm.date instanceof Date ? fm.date.toISOString().slice(0, 10) : fm.date };
      // 날짜를 따옴표 없이 쓰려고 dump 뒤에 되돌린다.
      const yaml = dump(out, { lineWidth: 80 }).replace(/^date: '(.*)'$/m, 'date: $1');
      fs.writeFileSync(rel(file), `---\n${yaml}---\n${m[2]}`);
    }
  }
  need(file, fm, ['title', 'title_ko', 'date', 'summary', 'summary_ko']);
  if (fm.date && Number.isNaN(new Date(fm.date).getTime())) err(file, `날짜를 읽을 수 없습니다: ${fm.date}`);
  needPublic(file, '첨부 문서', fm.file);
}

// ── 편집 화면 설정이 데이터의 모든 칸을 담고 있는지 ─────────────────────────
// 빠진 칸은 편집 화면에 보이지 않아, 있는 줄도 모르고 지나치게 된다.

const keyPaths = (v, prefix = '', out = new Set()) => {
  if (Array.isArray(v)) v.forEach((x) => keyPaths(x, prefix, out));
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      out.add(prefix + k);
      keyPaths(x, `${prefix}${k}.`, out);
    }
  return out;
};
const fieldPaths = (fields = [], prefix = '', out = new Set()) => {
  for (const f of fields) {
    out.add(prefix + f.name);
    fieldPaths(f.fields, `${prefix}${f.name}.`, out);
  }
  return out;
};
try {
  const cms = load(fs.readFileSync(rel('.pages.yml'), 'utf8'));
  for (const entry of cms.content) {
    const declared = fieldPaths(entry.fields);
    const used =
      entry.type === 'collection' ? newsFields : keyPaths(data[path.basename(entry.path, '.yaml')] ?? {});
    for (const k of used) if (!declared.has(k)) err('.pages.yml', `"${entry.name}" 에 "${k}" 칸이 빠져 있습니다.`);
  }
} catch (e) {
  err('.pages.yml', `읽을 수 없습니다 — ${e.message}`);
}

// ── 결과 ────────────────────────────────────────────────────────────────────

if (fixed.length) {
  console.log(FIX ? '자동으로 정리했습니다:' : '자동으로 정리할 수 있습니다 (npm run check -- --fix):');
  for (const f of fixed) console.log(`  - ${f}`);
}
if (errors.length) {
  console.error('\n직접 고쳐야 하는 문제가 있습니다:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('콘텐츠 검사 통과.');
