# PONS Lab 홈페이지 프로젝트

연세대학교 미래캠퍼스 의공학부 **PONS Lab — Physiological & On-body Neural Systems Lab** (PI: Hodam Kim 조교수)의 연구실 홈페이지. 기존 Google Sites(https://sites.google.com/view/npstlab)를 대체하는 리뉴얼 프로젝트다.

- **국문 명칭**: 뇌·신체·기계 인터페이스 연구실. 국문명은 영문 직역이 아니라 같은 철학(뇌+몸+잇기)을 담은 별도 명칭이다.
- **병기 원칙 (중요)**: 국문명을 표기할 때는 항상 "뇌·신체·기계 인터페이스 연구실(PONS Lab)"처럼 영문 약칭을 병기한다. 한국어 페이지(/ko/)의 사이트 제목·푸터·소개문 전부 이 원칙을 따른다.

- **태그라인**: "Bridging brain, body, and technology" — 메인 페이지 히어로와 사이트 메타 설명에 사용. pons는 뇌교(라틴어로 '다리')라는 뇌 구조에서 따온 이름이므로 이 은유를 브랜딩에 살릴 것.
- **브랜드 스토리 ("Why PONS?")**: 메인 페이지 히어로 아래(또는 연구실 소개 섹션)에 이름의 유래를 소개하는 짧은 섹션을 넣는다. 아래 문구를 그대로 사용 (site.yaml 또는 i18n 딕셔너리에 저장):
  - EN: "Our name, **PONS**, stands for *Physiological & On-body Neural Systems* — and it is also the brainstem structure that relays signals between the brain and the body. In Latin, *pons* means 'bridge.' True to its name, our lab builds bridges: between brain and body signals, between humans and machines, and between everyday life and healthcare technology."
  - KO: "연구실 이름 **PONS**는 *Physiological & On-body Neural Systems*의 약자이자, 뇌와 몸 사이의 신호를 이어주는 뇌 구조 '뇌교(pons)'의 이름이기도 합니다. 라틴어로 pons는 '다리'를 뜻합니다. 이름 그대로 우리 연구실은 뇌와 몸의 신호, 사람과 기계, 일상과 헬스케어 기술을 잇는 다리를 만듭니다."
- **이름 풀이 카드 (P·O·N·S)**: "Why PONS?" 스토리 바로 아래에 4개 카드 그리드로 배치 (모바일에서는 세로 스택). 각 카드는 머리글자를 크게 강조하고 아래 문구 사용:
  - **P — Physiological**: EN "We measure the body's vital signals — cardiac, respiratory, muscular, and beyond." / KO "심박·호흡·근육 등 몸이 보내는 생리신호를 측정합니다."
  - **O — On-body**: EN "We build soft, skin-conformal wearable devices for everyday life." / KO "일상에서 편안하게 착용하는 소프트 웨어러블 기기를 만듭니다."
  - **N — Neural**: EN "We sense and decode brain signals, from EEG to brain–computer interfaces." / KO "EEG부터 뇌-컴퓨터 인터페이스까지, 뇌·신경 신호를 측정하고 해석합니다."
  - **S — Systems**: EN "We integrate sensing, signal processing, and applications into complete systems for health and human–machine interaction." / KO "센싱·신호처리·응용을 통합해 헬스케어와 인간-기계 상호작용을 위한 시스템을 완성합니다."
- **주의**: 기존 사이트에는 옛 이름(NeuroPhysio Systems & Technology Lab, NPST Lab)이 쓰여 있다. 콘텐츠를 옮길 때 연구실명은 모두 PONS Lab으로 바꾼다.

## 사용자에 대해

- 사용자는 GitHub와 웹 개발 경험이 거의 없다. Git/GitHub 조작(커밋, 푸시, 저장소 생성, 배포)은 항상 네가 직접 수행하고, 전문 용어는 짧게 풀어서 설명할 것.
- 대화는 한국어로 한다.
- 되돌리기 어려운 작업(저장소 삭제, 강제 푸시, DNS 변경 등)은 실행 전에 반드시 확인받을 것.

## 기술 스택 (확정)

- **Astro** 정적 사이트, TypeScript 최소화, 프레임워크 컴포넌트(React 등) 없이 순수 Astro 컴포넌트 우선
- **배포**: GitHub Pages + GitHub Actions (push 시 자동 배포)
- **저장소·주소**: 저장소 이름은 `<GitHub계정명>.github.io` → 사이트 주소가 `https://<계정명>.github.io/`가 되고 Astro base path 설정이 불필요. 추후 학교 서브도메인(예: ponslab.yonsei.ac.kr)을 신청해 연결할 예정이므로 base path 없는 구조를 유지할 것.
- **다국어**: 영문이 기본(`/`), 한국어는 `/ko/` 경로. Astro 공식 i18n 라우팅 사용. UI 문자열은 딕셔너리 파일로 분리, 논문·멤버 등 데이터는 언어 공통으로 한 곳에서 관리

## 콘텐츠 관리 원칙 (중요)

논문·멤버·뉴스·강의는 코드가 아니라 **데이터 파일**로 관리한다. 사용자가 "논문 추가해줘"라고 하면 해당 데이터 파일만 수정하면 되도록:

```
src/data/site.yaml           # 연구실명(영문 풀네임·약칭·국문명)·태그라인·주소·연락처 (이름 변경 시 이 파일만 수정)
src/data/publications.yaml   # 논문 (연도, 저자, 저널, DOI, 태그: first/corresponding/member)
src/data/members.yaml        # PI·멤버·알럼나이
src/data/lectures.yaml       # 학기별 강의
src/content/news/*.md        # 뉴스 (파일 1개 = 글 1개)
```

- 연구실명·태그라인·연락처는 반드시 site.yaml에서만 참조 (하드코딩 금지)
- 논문 저자 표기 규칙 유지: 1저자 `1`, 교신저자 `*`, 랩 멤버 강조 표시
- 논문은 연도별 역순 그룹핑, DOI 링크 포함

## 사이트 구조

`/` Home(대표 비주얼+태그라인, 연구 하이라이트, 최신 논문 3편, 모집 배너) · `/research` · `/people` ·
`/publications` · `/lectures` · `/news` · `/gallery` · `/contact` · 동일 구조의 `/ko/…`

뉴스와 갤러리는 별도 페이지다.
- **뉴스는 글 목록**(날짜·태그·제목·요약·첨부문서). 카드가 아니라 리스트다.
- **갤러리는 행사별 카드**(대표 사진 + 제목 + 날짜 + 장수). 카드를 누르면 라이트박스로 그 행사의 사진을 넘겨본다.
- 회식·생일 같은 일상은 뉴스가 아니라 갤러리에만 둔다. 뉴스는 공지·수상·과제·연구실 이력만.

## 디자인 스펙 (기준 = 현재 사이트 코드)

**디자인 기준은 `src/` 안의 실제 코드다.** 토큰(색상·글꼴·간격·그림자)과 공통 클래스는 전부
`src/styles/global.css` 의 `:root` 와 유틸리티 클래스에 있고, 섹션별 세부 스타일은 각 `.astro`
컴포넌트의 `<style>` 블록에 있다. 새 화면을 만들 때는 아래 토큰과 공통 클래스를 재사용한다.

> 초기 시안 `design-reference.html` 은 역할이 끝나 저장소에서 삭제했다.
> 필요하면 git 이력(`git show 29e9b7d:design-reference.html`)에서 꺼내볼 수 있다.

- **톤**: 라이트 아카데믹 — 밝은 배경, 학술적 신뢰감 + 현대적 미니멀. 다크모드 없음.
- **색상 토큰** (`global.css` `:root`): 잉크 `--ink #16233b`, 본문 `--body #44536e`,
  뮤트 `--muted #6b7a94`, 포인트 `--accent #2153c4`, 진한 포인트 `--accent-deep #17408f`,
  포인트 배경 `--accent-soft #e8eefc`, 페이지 `--page #fbfcfe`, 카드 `--card #ffffff`,
  라인 `--line #e3e9f2`. 밴드 배경 `#f6f8fc` (섹션 교차용, 아직 토큰 아님).
- **타이포**: **제목·본문 모두 Inter 하나**로 통일한다(`--font-display` 는 `--font-sans` 를 가리키는
  별칭). 세리프(Fraunces)는 쓰지 않는다. 굵기와 자간으로 위계를 만든다.
  한국어 페이지(`/ko/`)에서만 Noto Sans KR 을 추가로 로드하고, 한국어 본문은 `word-break: keep-all`.
- **레이아웃 토큰**: `--container 1140px`, `--container-narrow 880px`, `--radius 14px`,
  `--radius-lg 22px`, `--section-y clamp(4rem, 8vw, 7rem)`, 그림자 `--shadow-sm/--shadow-md`.
- **공통 클래스**: `.container` / `.section` / `.section-tight` / `.card` `.card-hover` /
  `.btn`(`-primary` `-ghost` `-light` `-outline-light`, 알약형) / `.kicker`(대문자 트래킹 라벨,
  앞에 짧은 선) / `.lead` / `.tag` `.tag-quiet` / `.link-arrow`(호버 시 화살표 이동) /
  `.band-dark` / `.grid` `.grid-2~4` / `.mono-num`.
- **메인 페이지 섹션 순서 (현행)**: ① 히어로(연구실명 kicker + 태그라인 헤드라인 + 소개문 + CTA 2개 +
  EEG·ECG·RESP·EMG 4채널 파형 SVG + 신호 범례) → ② 모집 리본(연한 파란 띠) → ③ Research(2축 카드) →
  ④ Why PONS? 밴드(스토리 + 브릿지 일러스트 + P·O·N·S 카드 4개) → ⑤ News(최신 3건) →
  ⑥ Selected Publications(최신 3편) → ⑦ Join 밴드(다크 CTA) → ⑧ 푸터(다크).
  한국어 Join 밴드는 제목·부연 없이 모집 문구 한 줄 + 버튼만 두는 단순형이다.
- **서브 페이지 패턴**: 모두 `PageHero`(kicker + h1 + lead, 옅은 그라데이션 + 하단 라인)로 시작하고,
  본문은 흰 배경 섹션과 `#f6f8fc` 밴드를 번갈아 쌓는다.
- **헤더**: sticky + 반투명 blur, 좌측 브랜드(로고 마크 + `PONS Lab` + 풀네임), 우측 내비 + EN/KO 토글.
  1040px 이하에서 내비가 햄버거 패널로 접힌다.
- **모션**: 절제해서 쓴다 — 히어로 파형 그려지기, 모집 배지 펄스, 브릿지 위 신호 이동,
  카드 호버 살짝 올라오기 정도. 새 애니메이션을 넣을 때도 `prefers-reduced-motion` 처리를 반드시 포함.
- **참고**: 신뢰 지표(숫자 통계) 스트립은 사용자 결정으로 제외함 — 넣지 말 것
- 반응형 필수(모바일 우선 점검)
- 성능: 이미지는 `astro:assets` 의 `<Image>` 로 최적화, Lighthouse 90점 이상 목표

## SEO (기존 사이트의 최대 약점이었음)

- noindex 금지. sitemap, robots.txt, 페이지별 title/description, Open Graph 메타태그 필수
- 구조화 데이터(JSON-LD, Person/Organization) 추가

## 콘텐츠 출처

- 기존 사이트 https://sites.google.com/view/npstlab 의 콘텐츠를 이전한다 (Home, People, Research, Publications, Lecture, Board, Contact) — 연구실명만 PONS Lab으로 교체
- 연락처는 두 곳을 구분한다: **실험실**은 산학관 204호(전화 없음), **교수 연구실**은 백운관 201호(+82-33-760-2490).
  Contact 페이지는 둘 다 표기하고(지도는 산학관), 푸터와 CV 는 교수 연구실 기준으로 통일한다.

## 작업 방식

- 단계가 끝날 때마다 로컬 미리보기로 확인시켜 줄 것
- 의미 있는 변경마다 커밋. 커밋 메시지는 영어로 간결하게
- 배포 후에는 실제 URL을 알려줄 것

### UI 를 고친 뒤에는 (중요)

UI·레이아웃을 바꿨으면 **반드시 `npm run qa` 를 실행해 자동 검사를 통과시키고,
`qa/` 의 스크린샷을 직접 열어 눈으로 확인한 뒤 커밋한다.**

- 검사 항목: 요소 겹침 · 텍스트 넘침 · 가로 스크롤 · 깨진 내부 링크 · 콘솔 에러
- 데스크톱(1280)·태블릿(820)·모바일(390) 세 폭을 모두 본다
- 같은 검사가 GitHub Actions 에서도 돌아, 실패하면 배포되지 않는다
- 자동 검사는 "겹치지 않는다"까지만 보장한다. 보기 좋은지는 스크린샷으로 판단한다

### 문서 갱신 (중요)

**워크플로·데이터 구조·명령어가 바뀌면 `README.md` 를 같은 커밋에서 갱신한다.**
README 는 사용자가 보는 운영 매뉴얼이므로, 데이터 파일이 늘거나 옮겨가거나
npm 명령이 바뀌면 그 자리에서 함께 고친다.

### 원재료 파일 다루기 (중요)

사용자가 폴더에 넣어주는 **원재료 파일**(엑셀, docx, 원본 이미지, PDF 등)은 사이트
데이터로 옮기기 위한 재료일 뿐이다. 사이트의 일부가 아니다.

1. **절대 git 에 커밋하지 않는다.** 작업 중 잠시 둬야 하면 먼저 `.gitignore` 에 추가한다.
   (`git add -A` 로 딸려 들어가기 쉬우니, 커밋 전에 `git status` 를 확인할 것)
2. 데이터 반영이 끝나면 **더 필요 없는지 확인한 뒤 삭제한다.**
   - 삭제 전에 반영이 제대로 됐는지 원본과 대조해 확인한다
     (예: 논문 편수, 항목 개수, 빠진 섹션 유무)
   - 확인 결과와 함께 **사용자에게 알린 뒤** 지운다. 말없이 지우지 않는다
3. 재가공이 필요할 수 있는 원본(이미지 등)은 `_originals/` 에 두고 `.gitignore` 로 제외한다.
   `_originals/` 는 디스크에만 남고 저장소·배포에는 포함되지 않는다.
