// dist 의 CV 페이지를 인쇄해 PDF 두 개를 만든다.
//   /cv       → cv-full.pdf   (전체)
//   /cv/short → cv-short.pdf  (한 장 요약)
// 사이트에 이미 있는 CV 페이지를 그대로 쓰므로 내용이 두 벌로 갈라지지 않는다.
//
// dist 를 잠깐 HTTP 로 띄워서 연다. file:// 로 열면 페이지가 참조하는
// /_astro/*.css 절대경로가 디스크 루트를 가리켜 스타일이 하나도 적용되지 않는다.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const TARGETS = [
  { route: '/cv/', file: 'cv-full.pdf' },
  // 요약본은 한 장에 담으려고 여백을 조금 줄인다.
  { route: '/cv/short/', file: 'cv-short.pdf', alias: null, margin: '13mm 15mm' },
];

for (const t of TARGETS) {
  if (!fs.existsSync(path.join(dist, t.route.replace(/^\/|\/$/g, ''), 'index.html'))) {
    console.error(`dist${t.route}index.html 이 없습니다. 먼저 npm run build 를 실행하세요.`);
    process.exit(1);
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(dist, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  // dist 밖으로 나가는 경로는 거부한다.
  if (!file.startsWith(dist) || !fs.existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

// 인쇄 날짜와 쪽번호를 아래 여백에 넣는다. Chromium 의 머리말/꼬리말은
// 페이지 CSS 를 상속하지 않으므로 글꼴·크기를 여기서 직접 준다.
const updated = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const FOOTER = `
  <div style="width:100%;padding:0 19mm;font-family:Inter,Segoe UI,sans-serif;
              font-size:7.5pt;color:#8b98ad;display:flex;justify-content:space-between;">
    <span>Hodam Kim — Last updated: ${updated}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>`;

const browser = await chromium.launch();

for (const target of TARGETS) {
  const page = await browser.newPage();
  await page.goto(`${base}${target.route}`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);

  // 스타일이 실제로 붙었는지 확인한다. 안 붙었으면 PDF 를 만들지 않고 실패시킨다.
  const styled = await page.evaluate(() => {
    const h2 = document.querySelector('.cv-sec > h2');
    return h2 ? getComputedStyle(h2).textTransform === 'uppercase' : false;
  });
  if (!styled) {
    console.error(`${target.route} 에 스타일이 적용되지 않았습니다. PDF 를 만들지 않고 중단합니다.`);
    await browser.close();
    server.close();
    process.exit(1);
  }

  const out = path.join(dist, target.file);
  const short = Boolean(target.margin);
  await page.pdf({
    path: out,
    format: 'A4',
    printBackground: false,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: FOOTER,
    // 좌우 14mm 면 한 줄이 120자를 넘어 읽기 힘들다. 여백을 넓혀 100자 밑으로 둔다.
    // 아래 여백은 쪽번호 줄이 들어갈 만큼 남긴다.
    margin: short
      ? { top: '13mm', bottom: '16mm', left: '15mm', right: '15mm' }
      : { top: '15mm', bottom: '16mm', left: '19mm', right: '19mm' },
  });
  await page.close();

  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${target.file} 생성 완료 (${kb} kB)`);
}

await browser.close();
server.close();
