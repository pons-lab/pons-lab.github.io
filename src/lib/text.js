const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * yaml 안에 적어둔 아주 단순한 마크다운(**굵게**, *기울임*)만 HTML 로 바꾼다.
 * 그 외의 태그는 모두 이스케이프하므로 데이터 파일에 HTML 을 넣을 수 없다.
 */
export function inlineMd(text) {
  return String(text ?? '')
    .replace(/[&<>"']/g, (c) => ESCAPE[c])
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*(?!\s)(.+?)(?<!\s)\*/g, '$1<em>$2</em>');
}

/**
 * 줄바꿈되면 안 되는 고유명사 구문을 한 덩어리로 묶는다.
 *
 * "Yonsei University Mirae Campus" 처럼 하나의 이름인데 중간에서 줄이 바뀌면
 * 읽는 사람이 두 기관으로 오해한다. 구문 안의 띄어쓰기를 줄바꿈 없는 공백
 * (non-breaking space)으로 바꾸면 브라우저가 구문 전체를 한 단어처럼 다룬다.
 * 결과적으로 줄은 구문 사이(대개 쉼표 뒤)에서만 바뀐다.
 *
 * 새 고유명사가 생기면 아래 목록에만 추가하면 사이트 전체에 적용된다.
 * 긴 구문이 먼저 와야 한다 — "Yonsei University" 가 먼저 걸리면
 * "… Mirae Campus" 가 떨어져 나간다.
 */
const UNBREAKABLE = [
  'Yonsei University Mirae Campus',
  'Yonsei University',
  'Hanyang University',
  'Neural Systems Lab',
  'PONS Lab',
  '연세대학교 미래캠퍼스',
  '연세대학교 대학원',
];

export function keepTogether(text) {
  let out = String(text ?? '');
  for (const phrase of UNBREAKABLE) {
    out = out.split(phrase).join(phrase.replaceAll(' ', '\u00a0'));
  }
  return out;
}
