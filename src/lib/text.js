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
