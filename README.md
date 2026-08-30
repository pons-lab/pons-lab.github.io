# PONS Lab 홈페이지

연세대학교 미래캠퍼스 의공학부 **PONS Lab — Physiological & On-body Neural Systems Lab**
(뇌·신체·기계 인터페이스 연구실) 홈페이지 소스입니다.

- 사이트 주소: <https://pons-lab.github.io/>
- `main` 브랜치에 푸시하면 GitHub Actions 가 자동으로 빌드해서 배포합니다.

---

## 내용만 고치고 싶을 때

코드를 몰라도 아래 파일만 고치면 사이트 내용이 바뀝니다.
GitHub 웹사이트에서 파일을 열고 연필(✏️) 아이콘을 눌러 바로 수정할 수 있습니다.
수정 후 **Commit changes** 를 누르면 1~2분 뒤 사이트에 반영됩니다.

| 고치고 싶은 것 | 파일 |
|---|---|
| 연구실 이름·태그라인·주소·전화·이메일·모집 문구 | `src/data/site.yaml` |
| 논문 (학술지 / 학회) | `src/data/publications.yaml` |
| 구성원 (교수·대학원생·학부연구생·알럼나이) | `src/data/members.yaml` |
| 강의 (학기별) | `src/data/lectures.yaml` |
| 연구 분야·진행 과제 | `src/data/research.yaml` |
| 갤러리 (행사별 사진 묶음, `/gallery` 페이지) | `src/data/gallery.yaml` |
| 소식 — 파일 1개 = 글 1개 | `src/content/news/*.md` |
| 화면에 나오는 버튼·메뉴 문구 | `src/i18n/ui.js` |

각 파일 맨 위에 한국어 사용법이 적혀 있습니다.

### 논문 추가

`src/data/publications.yaml` 의 `journals:` 맨 위에 항목을 복사해서 붙여넣고 고칩니다.

```yaml
  - id: 30                      # 기존 번호 + 1
    year: 2026                  # 아직 안 나왔으면 지우고 status: in-revision
    authors: >-
      Hodam Kim1, ... , Woon-Hong Yeo*
    title: 논문 제목
    venue: 저널 이름
    detail: 12 (3), 45-67
    doi: 10.1234/example        # 링크는 자동 생성됩니다
```

저자 표기 규칙: 이름 뒤 `1` = 제1저자, `*` = 교신저자, `1*` = 둘 다.
연구실 구성원 이름은 `site.yaml` 의 `lab_authors` 에 있으면 자동으로 굵게 표시됩니다.

### 소식 추가

`src/content/news/` 에 `2026-09-무슨일.md` 같은 파일을 하나 만듭니다.

```markdown
---
title: New paper accepted
title_ko: 논문 게재 확정
date: 2026-09-15
tag: Paper
tag_ko: 논문
summary: One or two lines in English.
summary_ko: 한두 줄 요약.
---
```

뉴스는 글로만 표시됩니다. 사진은 갤러리(`/gallery`)에서 따로 관리합니다.

### 사진 추가

사진은 반드시 **`src/assets/`** 안에 넣습니다. (`public/` 에 넣으면 용량이 줄지 않아 사이트가 느려집니다.)

- 구성원 사진: `src/assets/people/` → `members.yaml` 에 `photo: people/파일명.jpg`
- 갤러리 사진: `src/assets/gallery/행사이름/` → `gallery.yaml` 에 `folder: 행사이름`
  (폴더 안 사진이 파일명 순서대로 표시됩니다. 대표로 쓸 사진을 `01.jpg` 로 바꾸세요.)

### 상장·증명서 같은 문서 올리기

`public/docs/` 에 PDF 를 넣으면 그대로 사이트 주소로 열립니다.
파일 이름은 `연도-월-무슨자료-이름.pdf` 형식으로, 영문 소문자와 하이픈만 씁니다.

넣은 문서는 뉴스나 수상 내역에 연결할 수 있습니다.

- 뉴스: `src/content/news/*.md` 에 `file: /docs/파일명.pdf` 와 `file_label: 상장 보기` 추가
- 수상 내역: `src/data/members.yaml` 의 `awards:` 항목에 `file: /docs/파일명.pdf` 추가

지도학생이 받은 상은 `advisee_ko: 지도학생 OOO 수상` 을 함께 적으면
"지도학생" 표시가 붙습니다. 자세한 내용은 `public/docs/README.md` 참고.

---

## 개발자용

```bash
npm install      # 최초 1회
npm run dev      # 로컬 미리보기 http://localhost:4321
npm run build    # dist/ 에 정적 파일 생성
npm run preview  # 빌드 결과 확인
```

- **Astro** 정적 사이트, 프레임워크 컴포넌트 없이 순수 `.astro` 컴포넌트
- 다국어: 영문 기본(`/`), 한국어 `/ko/` — Astro 공식 i18n 라우팅
- 이미지: `astro:assets` 의 `<Image>` 로 빌드 시 자동 최적화 (webp 변환·리사이즈)
- 디자인 기준은 `src/` 안의 실제 코드입니다. 토큰은 `src/styles/global.css` 의 `:root`,
  세부 스타일은 각 컴포넌트의 `<style>` 블록에 있습니다. 자세한 내용은 `CLAUDE.md` 참고.

### 주소를 학교 도메인으로 바꿀 때

`astro.config.mjs` 의 `site` 한 줄과 `public/robots.txt` 의 Sitemap 주소를 바꾸고,
저장소 Settings > Pages > Custom domain 에 도메인을 등록합니다.
