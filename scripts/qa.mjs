/**
 * 자동 레이아웃 점검 (npm run qa)
 *
 * 빌드된 사이트(dist)를 띄우고 모든 페이지를 세 폭에서 열어
 *   · 전체 페이지 스크린샷을 qa/ 에 저장하고
 *   · 겹침 / 넘침 / 가로 스크롤 / 깨진 내부 링크 / 콘솔 에러를 찾는다.
 *
 * 문제가 있으면 표로 출력하고 종료 코드 1 로 끝난다 (CI 에서 배포 전에 걸린다).
 *
 * 옵션
 *   --shots-only   검사 없이 스크린샷만
 *   --url=/cv      특정 페이지만
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const shotDir = path.join(root, 'qa');

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--url='))?.slice(6);
const shotsOnly = args.includes('--shots-only');

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];

if (!fs.existsSync(dist)) {
  console.error('dist 가 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
}

// ── dist 를 정적 서버로 띄운다 ──────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  let file = path.join(dist, decodeURI(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(dist) || !fs.existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ── 점검할 페이지 = dist 안의 모든 index.html ───────────────────────────
function routes(dir = dist, prefix = '/') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === '_astro' || e.name === 'images' || e.name === 'docs') continue;
      out.push(...routes(path.join(dir, e.name), prefix + e.name + '/'));
    } else if (e.name === 'index.html') {
      out.push(prefix);
    }
  }
  return out;
}
const pages = (only ? [only.endsWith('/') ? only : only + '/'] : routes()).sort();

fs.rmSync(shotDir, { recursive: true, force: true });
fs.mkdirSync(shotDir, { recursive: true });

/** 페이지 안에서 겹침·넘침을 찾는다. 브라우저 안에서 도는 코드다. */
const AUDIT = () => {
  const problems = [];
  const label = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text}"` : ''}`;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };

  // ① 텍스트가 제 칸을 넘는가
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg')) continue;
    const s = getComputedStyle(el);
    if (s.overflowX !== 'visible' || el.children.length > 0) continue;
    if (el.scrollWidth > el.clientWidth + 1) {
      problems.push({ kind: '텍스트 넘침', el: label(el), detail: `${el.scrollWidth} > ${el.clientWidth}px` });
    }
  }

  // ② 형제끼리 겹치는가
  //    블록으로 놓인 형제만 본다. 문장 속 <span> 은 여러 줄에 걸치면 경계상자가
  //    줄 전체를 덮어 서로 겹친 것처럼 보이므로 인라인 요소는 제외한다.
  //    겹치기를 의도한 배경·장식(absolute/fixed)과 svg 내부도 제외한다.
  const BLOCKISH = new Set(['block', 'flex', 'grid', 'list-item', 'table', 'flow-root']);
  const seen = new Set();
  for (const parent of document.querySelectorAll('body *')) {
    if (parent.closest('svg')) continue;
    const kids = [...parent.children].filter((el) => {
      if (!visible(el) || el.closest('svg')) return false;
      const s = getComputedStyle(el);
      if (s.position !== 'static' && s.position !== 'relative') return false;
      return BLOCKISH.has(s.display);
    });
    if (kids.length < 2) continue;
    const ps = getComputedStyle(parent);
    if (ps.display.includes('flex') && ps.flexWrap === 'nowrap') continue; // 겹칠 수 없음
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect();
        const b = kids[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 2 && oy > 2) {
          const key = label(kids[i]) + '|' + label(kids[j]);
          if (seen.has(key)) continue;
          seen.add(key);
          problems.push({
            kind: '요소 겹침',
            el: `${label(kids[i])}  ↔  ${label(kids[j])}`,
            detail: `${Math.round(ox)}×${Math.round(oy)}px`,
          });
        }
      }
    }
  }

  // ③ 가로 스크롤
  if (document.documentElement.scrollWidth > window.innerWidth + 1) {
    problems.push({
      kind: '가로 스크롤',
      el: 'document',
      detail: `${document.documentElement.scrollWidth} > ${window.innerWidth}px`,
    });
  }

  const links = [...document.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && !/^(https?:|mailto:|tel:|#)/.test(h));

  return { problems, links };
};

// ── 실행 ────────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const findings = [];
const linkCache = new Map();

for (const route of pages) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors = [];
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const name = (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '-'));
    await page.screenshot({ path: path.join(shotDir, `${name}__${vp.name}.png`), fullPage: true });

    if (!shotsOnly) {
      const { problems, links } = await page.evaluate(AUDIT);
      for (const p of problems) findings.push({ page: route, viewport: vp.name, ...p });
      for (const e of consoleErrors) {
        findings.push({ page: route, viewport: vp.name, kind: '콘솔 에러', el: '-', detail: e.slice(0, 80) });
      }
      // 내부 링크는 폭에 상관없으므로 한 번만 확인한다
      if (vp.name === 'desktop') {
        for (const href of new Set(links)) {
          const url = new URL(href, base + route);
          if (!linkCache.has(url.pathname)) {
            const r = await fetch(base + url.pathname).catch(() => null);
            linkCache.set(url.pathname, r?.ok ?? false);
          }
          if (!linkCache.get(url.pathname)) {
            findings.push({ page: route, viewport: '-', kind: '깨진 링크', el: href, detail: '404' });
          }
        }
      }
    }
    await page.close();
  }
}
await browser.close();
server.close();

// ── 결과 ────────────────────────────────────────────────────────────────
const shots = fs.readdirSync(shotDir).length;
console.log(`\n페이지 ${pages.length}개 × 화면 ${VIEWPORTS.length}폭 — 스크린샷 ${shots}장을 qa/ 에 저장했습니다.`);

if (shotsOnly) process.exit(0);

if (findings.length === 0) {
  console.log('\n문제 없음. 스크린샷을 직접 열어 확인하세요: qa/\n');
  process.exit(0);
}

const w = (rows, k) => Math.max(k.length, ...rows.map((r) => [...String(r[k])].reduce((n, c) => n + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0)));
const pad = (v, n) => {
  const s = String(v);
  const width = [...s].reduce((n2, c) => n2 + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
  return s + ' '.repeat(Math.max(0, n - width));
};
const cols = ['kind', 'page', 'viewport', 'el', 'detail'];
const head = { kind: '유형', page: '페이지', viewport: '폭', el: '요소', detail: '상세' };
const rows = [head, ...findings];
const widths = Object.fromEntries(cols.map((c) => [c, w(rows, c)]));

console.log(`\n문제 ${findings.length}건\n`);
console.log(cols.map((c) => pad(head[c], widths[c])).join('  '));
console.log(cols.map((c) => '─'.repeat(widths[c])).join('  '));
for (const f of findings) console.log(cols.map((c) => pad(f[c], widths[c])).join('  '));
console.log('');
process.exit(1);
