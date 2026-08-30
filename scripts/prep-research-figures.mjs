// images/ 의 논문 도면을 연구 카드용으로 손질한다.
//  - 빨간 주석선은 사진에 인쇄돼 있어 크롭으로 못 지우므로 붉은 화소를 주변 중앙값으로 메운다
//  - 사진 자체의 회색 배경은 카드 배경색으로 갈아끼워 카드와 이어 보이게 한다
import sharp from 'sharp';

const W = 800;
const H = 460;
const BG = [244, 247, 253]; // #f4f7fd — 기존 SVG 도식 배경과 동일

const raw = (buf) => sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const wrap = ({ data, info }) =>
  sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();

/** 붉은 주석 화소를 골라 주변 색의 중앙값으로 메운다. */
async function removeRed(buf, passes = 3) {
  let { data, info } = await raw(buf);
  const { width: w, height: h, channels: ch } = info;
  const at = (x, y) => (y * w + x) * ch;

  for (let pass = 0; pass < passes; pass++) {
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = at(x, y);
        if (data[i] > 110 && data[i] - data[i + 1] > 45 && data[i] - data[i + 2] > 45) mask[y * w + x] = 1;
      }
    const grown = new Uint8Array(mask);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++)
        if (mask[y * w + x])
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) grown[(y + dy) * w + x + dx] = 1;

    const out = Buffer.from(data);
    let filled = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!grown[y * w + x]) continue;
        const R = [], G = [], B = [];
        for (let dy = -5; dy <= 5; dy++)
          for (let dx = -5; dx <= 5; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || grown[ny * w + nx]) continue;
            const j = at(nx, ny);
            R.push(data[j]); G.push(data[j + 1]); B.push(data[j + 2]);
          }
        if (!R.length) continue;
        const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
        const i = at(x, y);
        out[i] = med(R); out[i + 1] = med(G); out[i + 2] = med(B);
        filled++;
      }
    data = out;
    if (!filled) break;
  }
  return wrap({ data, info });
}

/** 사진의 균일한 배경(모서리 색 기준)을 카드 배경색으로 바꾼다. 경계는 부드럽게 섞는다. */
async function swapBackground(buf, near = 30, far = 72) {
  const { data, info } = await raw(buf);
  const { width: w, height: h, channels: ch } = info;
  // 모서리에 검은 테두리가 있을 수 있으므로, 윗줄 전체의 중앙값을 배경색으로 본다
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const cols = [[], [], []];
  for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) cols[k].push(data[(3 * w + x) * ch + k]);
  const c = cols.map(med);
  const out = Buffer.from(data);
  for (let p = 0; p < w * h; p++) {
    const i = p * ch;
    const d = Math.hypot(data[i] - c[0], data[i + 1] - c[1], data[i + 2] - c[2]);
    if (d >= far) continue;
    const t = d <= near ? 1 : (far - d) / (far - near); // 배경에 가까울수록 1
    for (let k = 0; k < 3; k++) out[i + k] = Math.round(data[i + k] * (1 - t) + BG[k] * t);
  }
  return wrap({ data: out, info });
}

/** 조각들을 카드 배경 위에 가로로 나란히 얹는다. */
async function compose(parts, out, { gap = 20, pad = 14 } = {}) {
  const inner = H - pad * 2;
  const prepared = [];
  for (const p of parts) {
    const m = await sharp(p).metadata();
    prepared.push({
      buf: await sharp(p).resize({ height: inner }).toBuffer(),
      w: Math.round(m.width * (inner / m.height)),
    });
  }
  // 가로가 캔버스를 넘치면 전체를 같은 비율로 줄인다
  let total = prepared.reduce((s, p) => s + p.w, 0) + gap * (prepared.length - 1);
  const avail = W - pad * 2;
  if (total > avail) {
    const k = avail / total;
    for (const p of prepared) {
      p.w = Math.round(p.w * k);
      p.buf = await sharp(p.buf).resize({ width: p.w }).toBuffer();
    }
    total = prepared.reduce((s, p) => s + p.w, 0) + gap * (prepared.length - 1);
  }
  const tallest = Math.max(...(await Promise.all(prepared.map(async (p) => (await sharp(p.buf).metadata()).height))));
  let x = Math.round((W - total) / 2);
  const top = Math.round((H - tallest) / 2);
  const layers = prepared.map((p) => {
    const l = { input: p.buf, left: x, top };
    x += p.w + gap;
    return l;
  });
  await sharp({ create: { width: W, height: H, channels: 3, background: { r: BG[0], g: BG[1], b: BG[2] } } })
    .composite(layers)
    .webp({ quality: 88 })
    .toFile(out);
}

// ── 1) 일상 속 뇌신호 센서 : 손끝 컷 + 뒤통수 착용 컷 ─────────────────
const src1 = '_originals/figures/comfortable EEg device.png';
// 손끝 — 손가락에 바짝 붙여 자른다 (위쪽 분홍 콜아웃·검은 테두리 제외)
await sharp(src1).extract({ left: 30, top: 436, width: 344, height: 264 }).toFile('prep-finger.png');
// 뒤통수 — 인셋과 스케일바 아래부터, 머리와 무선 모듈 위주로
await sharp(await removeRed(await sharp(src1).extract({ left: 566, top: 300, width: 312, height: 396 }).toBuffer()))
  .toFile('prep-head.png');
await compose(['prep-finger.png', 'prep-head.png'], 'src/assets/research/brain-sensor.webp');

// ── 2) 인간-기계 인터페이스 : 전완부 패치 ────────────────────────────
// 사진의 회색 배경을 카드 배경으로 바꾸고, 여백을 걷어내 피사체를 키운다
// 가장자리의 검은 테두리를 먼저 잘라낸 뒤 배경을 갈아끼운다
const hmiSrc = await sharp('_originals/figures/Soft patch sensor.png')
  .extract({ left: 4, top: 4, width: 403, height: 341 })
  .toBuffer();
await sharp(await swapBackground(hmiSrc)).trim({ threshold: 6 }).toFile('prep-hmi.png');
await compose(['prep-hmi.png'], 'src/assets/research/hmi-forearm-emg.webp', { pad: 8 });

// ── 3) 통합 멀티센서 모니터링 : 사진(좌, 꽉 채움) + 기존 도식(우) ──────
// 둘 다 가로로 긴 그림이라 나란히 줄여 놓으면 위아래가 텅 빈다.
// 사진은 카드 높이를 꽉 채우고, 도식은 그 옆 밝은 바탕에 얹는다.
{
  const photoW = 356;
  const photo = await sharp('_originals/figures/Integrated Multi-sensor Monitoring System.png')
    .resize(photoW, H, { fit: 'cover', position: 'centre' })
    .toBuffer();
  const diagramW = W - photoW - 44;
  const diagram = await sharp('src/assets/research/multi-sensor.svg', { density: 300 })
    .resize({ width: diagramW })
    .flatten({ background: { r: BG[0], g: BG[1], b: BG[2] } })
    .toBuffer();
  const dh = (await sharp(diagram).metadata()).height;
  await sharp({ create: { width: W, height: H, channels: 3, background: { r: BG[0], g: BG[1], b: BG[2] } } })
    .composite([
      { input: photo, left: 0, top: 0 },
      { input: diagram, left: photoW + 22, top: Math.round((H - dh) / 2) },
    ])
    .webp({ quality: 88 })
    .toFile('src/assets/research/multi-sensor.webp');
}

// Join 밴드 배경 (같은 사진, 밴드 폭으로 확대 + 약한 블러)
await sharp('_originals/figures/Integrated Multi-sensor Monitoring System.png')
  .resize(1600, 520, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
  .blur(1.4)
  .webp({ quality: 78 })
  .toFile('src/assets/join-circuit.webp');

console.log('연구 카드 이미지 생성 완료');
