# 문서 보관함 (상장 · 증명서 · 자료)

이 폴더에 넣은 파일은 그대로 사이트 주소로 열립니다.

    public/docs/파일이름.pdf   →   https://pons-lab.github.io/docs/파일이름.pdf

## 파일 이름 규칙

    연도-월-무슨자료-이름.pdf

예) `2026-05-kosombe-best-poster-yoon-seoyeon.pdf`

한글·공백·괄호가 들어간 이름은 주소에서 깨질 수 있으니 영문 소문자와 하이픈만 씁니다.

## 사이트에서 연결하는 법

- **뉴스에 붙이기** — `src/content/news/*.md` 의 앞부분에 아래 두 줄을 추가
  ```
  file: /docs/2026-05-kosombe-best-poster-yoon-seoyeon.pdf
  file_label: 상장 보기
  ```
- **수상 내역에 붙이기** — `src/data/members.yaml` 의 해당 `awards:` 항목에 추가
  ```
  file: /docs/2026-05-kosombe-best-poster-yoon-seoyeon.pdf
  ```

파일을 넣기만 하고 위 줄을 안 적으면 사이트에는 보이지 않고 보관만 됩니다.
