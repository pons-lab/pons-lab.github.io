// dist/cv 를 인쇄해 dist/cv.pdf 를 만든다.
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
const out = path.join(dist, 'cv.pdf');

if (!fs.existsSync(path.join(dist, 'cv', 'index.html'))) {
  console.error('dist/cv/index.html 이 없습니다. 먼저 npm run build 를 실행하세요.');
  process.exit(1);
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

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/cv/`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => document.fonts.ready);

// 스타일이 실제로 붙었는지 확인한다. 안 붙었으면 PDF 를 만들지 않고 실패시킨다.
const styled = await page.evaluate(() => {
  const h2 = document.querySelector('.cv-sec > h2');
  return h2 ? getComputedStyle(h2).textTransform === 'uppercase' : false;
});
if (!styled) {
  console.error('CV 페이지에 스타일이 적용되지 않았습니다. PDF 를 만들지 않고 중단합니다.');
  await browser.close();
  server.close();
  process.exit(1);
}

await page.pdf({
  path: out,
  format: 'A4',
  printBackground: false,
  // 좌우 14mm 면 한 줄이 120자를 넘어 읽기 힘들다. 여백을 넓혀 100자 밑으로 둔다.
  margin: { top: '16mm', bottom: '16mm', left: '19mm', right: '19mm' },
});

await browser.close();
server.close();

console.log('cv.pdf 생성 완료 (' + Math.round(fs.statSync(out).size / 1024) + ' kB)');
