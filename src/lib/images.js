// ============================================================================
// 사진 불러오기
//
// 사진 파일은 src/assets/ 안에 두면 Astro 가 자동으로 크기를 줄이고 webp 로
// 변환해 줍니다. (public/ 에 두면 최적화가 되지 않아 사이트가 느려집니다.)
//
//   src/assets/people/*        구성원 사진
//   src/assets/gallery/<행사>/ 갤러리 사진
//   src/assets/research/*      연구 카드 썸네일
//
// yaml 파일에는 src/assets/ 아래의 상대 경로만 적으면 됩니다.
//   예) members.yaml  photo: people/pi.jpg
//       gallery.yaml  folder: 2026-04-dinner
// ============================================================================

const assets = import.meta.glob('/src/assets/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

/** 'people/pi.jpg' 같은 상대 경로를 실제 이미지로 바꾼다. 없으면 null. */
export function asset(relativePath) {
  if (!relativePath) return null;
  const key = `/src/assets/${String(relativePath).replace(/^\/+/, '')}`;
  return assets[key]?.default ?? null;
}

/** 갤러리 폴더 하나에 들어 있는 사진을 파일명 순서대로 모두 돌려준다. */
export function galleryPhotos(folder) {
  if (!folder) return [];
  const prefix = `/src/assets/gallery/${folder}/`;
  return Object.keys(assets)
    .filter((k) => k.startsWith(prefix))
    .sort()
    .map((k) => assets[k].default);
}
