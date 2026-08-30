// dist/cv/index.html 을 인쇄해 dist/cv.pdf 를 만든다.
// 사이트에 이미 있는 CV 페이지를 그대로 쓰므로 내용이 두 벌로 갈라지지 않는다.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.join(root, 'dist', 'cv', 'index.html');
const out = path.join(root, 'dist', 'cv.pdf');

if (!fs.existsSync(html)) {
  console.error('dist/cv/index.html 이 없습니다. 먼저 astro build 를 실행하세요.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: false,
  margin: { top: '16mm', bottom: '16mm', left: '15mm', right: '15mm' },
});
await browser.close();

console.log('cv.pdf 생성 완료 (' + Math.round(fs.statSync(out).size / 1024) + ' kB)');
