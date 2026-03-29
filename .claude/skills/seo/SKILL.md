---
name: seo
description: SEO 감사 → 자동 수정 → 인덱싱 확인까지 한 번에. Google 검색 1페이지 노출을 위한 종합 SEO 스킬.
---

# SEO — 종합 검색 최적화 스킬

너는 **SEO Specialist + Technical SEO Engineer + Content Strategist**야.
Google 검색 1페이지 노출을 목표로, `/seo` 한 번 실행하면 **감사 → 자동 수정 → 인덱싱 확인**까지 전체 파이프라인을 순차 실행한다.

**핵심 원칙: SEO는 이 서비스의 유입 핵심. 모든 판단은 Google 공식 문서를 근거로 한다. "무료" 키워드는 절대 사용하지 않는다 (유료 SaaS).**

---

## 프로젝트 컨텍스트

- **프레임워크**: Next.js 15 (App Router), React 18, Tailwind CSS v3, Framer Motion
- **배포**: Vercel
- **프로덕션 URL**: `https://phos.studio`
- **수익 모델**: 구독 SaaS (크레딧 기반)
- **백엔드**: Supabase (Auth/DB)
- **언어**: 현재 한국어 기본 — **글로벌 확장 예정** (다국어/hreflang 대응 필요)
- **빌드**: `yarn build`
- **페이지 라우트** (app/ 디렉토리에서 동적 감지):
  - `app/page.tsx` — 홈/랜딩
  - `app/image-edit/` — AI 이미지 편집
  - `app/retouching/` — AI 피부 보정
  - `app/face-edit/` — AI 얼굴 변경
  - `app/pricing/` — 요금제
  - `app/terms/` — 이용약관
  - `app/privacy/` — 개인정보처리방침
  - `app/data-deletion/` — 데이터 삭제

### 기존 SEO 인프라 (이미 구현된 것)

감사 전에 현재 상태를 반드시 코드를 읽어 최신 상태로 파악한다:

- `app/layout.tsx` — 루트 metadata (title, description, metadataBase, OG, Twitter)
- `app/opengraph-image.tsx` — 동적 OG 이미지 (1200x630, Edge Runtime)
- `app/sitemap.ts` — 전체 페이지 사이트맵
- `app/robots.ts` — robots.txt (/api/ 차단)
- 각 에디터 `layout.tsx` — 페이지별 metadata + BreadcrumbList JSON-LD
- `app/pricing/layout.tsx` — FAQPage JSON-LD

---

## Google SEO 공식 문서 레퍼런스

감사/최적화 시 아래 문서를 근거로 판단한다. 이슈 리포트에 관련 문서 링크를 반드시 첨부한다.

### Search Essentials (검색 기본)
- https://developers.google.com/search/docs/essentials — 핵심 요건 개요
- https://developers.google.com/search/docs/essentials/technical — 기술 요건 (크롤링, 인덱싱, 렌더링)
- https://developers.google.com/search/docs/essentials/spam-policies — 스팸 정책 (위반 시 순위 하락/제외)
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content — 유용한 콘텐츠 기준
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide — SEO 시작 가이드
- https://developers.google.com/search/docs/fundamentals/how-search-works — 크롤링→인덱싱→서빙 원리

### 크롤링 & 인덱싱
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview — 사이트맵 개요
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap — 사이트맵 생성/제출
- https://developers.google.com/search/docs/crawling-indexing/robots/intro — robots.txt 소개
- https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt — robots.txt 사양
- https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt — robots.txt 작성
- https://developers.google.com/search/docs/crawling-indexing/canonicalization — 정규 URL 개요
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — 중복 URL 통합 방법
- https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing — 모바일 우선 인덱싱
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics — JavaScript SEO 기초
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable — 링크 크롤링 모범 사례
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag — robots 메타태그 (noindex, nofollow 등)
- https://developers.google.com/search/docs/crawling-indexing/special-tags — Google 지원 메타태그 전체 목록
- https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget — 대형 사이트 크롤 버짓 관리

### 검색 노출 (Appearance)
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data — 구조화 데이터 개요
- https://developers.google.com/search/docs/appearance/structured-data/search-gallery — 지원 구조화 데이터 전체 갤러리
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies — 구조화 데이터 정책/가이드라인
- https://developers.google.com/search/docs/appearance/structured-data/software-app — SoftwareApplication 마크업
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb — BreadcrumbList 마크업
- https://developers.google.com/search/docs/appearance/structured-data/faqpage — FAQPage 마크업
- https://developers.google.com/search/docs/appearance/structured-data/how-to — HowTo 마크업
- https://developers.google.com/search/docs/appearance/structured-data/organization — Organization 마크업
- https://developers.google.com/search/docs/appearance/structured-data/article — Article 마크업
- https://developers.google.com/search/docs/appearance/title-link — 제목 링크 (Google이 표시하는 제목)
- https://developers.google.com/search/docs/appearance/snippet — 스니펫/메타 설명 최적화
- https://developers.google.com/search/docs/appearance/sitelinks — 사이트링크 작동 원리

### 국제화 SEO (International) — 글로벌 확장 시 필수
- https://developers.google.com/search/docs/specialty/international — 국제화 SEO 허브
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites — 다국어/다지역 사이트 관리
- https://developers.google.com/search/docs/specialty/international/localized-versions — hreflang 태그로 로컬라이즈 버전 알리기
- https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages — 로케일 적응 페이지 크롤링

### Google Search Console
- https://support.google.com/webmasters/answer/9128669 — Search Console 시작하기
- https://support.google.com/webmasters/answer/7440203 — 페이지 인덱싱 리포트
- https://support.google.com/webmasters/answer/7576553 — 실적 리포트
- https://support.google.com/webmasters/answer/9012289 — URL 검사 도구

### 측정 도구
- https://web.dev/articles/google-search-tools — Google 검색 디버깅 도구
- https://search.google.com/test/rich-results — Rich Results 테스트
- https://validator.schema.org — Schema.org 검증기

---

## 감사 기준 (Quick Reference)

### 메타태그
| 항목 | 규칙 | 근거 |
|------|------|------|
| title | 30-60자 (영문), 15-30자 (CJK). 페이지마다 고유. 주요 키워드 앞쪽 배치 | [title-link](https://developers.google.com/search/docs/appearance/title-link) |
| description | 70-160자 (영문), 40-80자 (CJK). CTA + 키워드 포함 | [snippet](https://developers.google.com/search/docs/appearance/snippet) |
| canonical | 절대 URL. 모든 페이지에 self-referencing. sitemap URL과 일치 | [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| robots | 기본 index,follow. 법적 페이지(privacy, terms)만 선택적 noindex | [robots-meta-tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| viewport | `width=device-width, initial-scale=1` (Next.js 기본 제공) | [mobile-first](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) |

### 구조화 데이터 (SaaS 에디터)
| 스키마 | 적용 위치 | 필수 속성 | 근거 |
|--------|----------|----------|------|
| Organization | 루트 레이아웃 | name, url, logo | [organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| WebApplication | 에디터 페이지 | name, description, url, applicationCategory, offers, operatingSystem | [software-app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| BreadcrumbList | 모든 하위 페이지 | itemListElement[{name, item}] | [breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| FAQPage | FAQ 있는 페이지 | mainEntity[{name, acceptedAnswer}] | [faqpage](https://developers.google.com/search/docs/appearance/structured-data/faqpage) |
| HowTo | 사용법 있는 페이지 | name, step[{name, text}] | [how-to](https://developers.google.com/search/docs/appearance/structured-data/how-to) |

### 언어 설정 (글로벌 확장 대응)
| 규칙 | 설명 |
|------|------|
| lang 속성 | 현재 `<html lang="ko">` — 다국어 시 동적 전환 |
| hreflang | 현재 불필요 (단일 언어) — **다국어 도입 시 x-default + 언어별 hreflang 필수** |
| og:locale | 현재 `ko_KR` — 다국어 시 `og:locale:alternate` 추가 |

### Open Graph / Twitter Cards
| 항목 | 규칙 |
|------|------|
| og:title | title과 동일하거나 더 매력적인 제목 |
| og:description | description과 동일하거나 소셜용으로 최적화 |
| og:image | 1200x630px 이상. 모든 페이지에 필수 |
| og:url | 페이지의 canonical URL |
| og:type | "website" (홈) 또는 적절한 타입 |
| og:locale | `ko_KR` (현재 기본) |
| og:site_name | `Phos AI` |
| twitter:card | "summary_large_image" 권장 |

### 이미지 SEO
| 규칙 | 이유 |
|------|------|
| 모든 이미지에 alt 텍스트 | 접근성 + 이미지 검색 노출 |
| width/height 또는 fill 지정 | CLS 방지 |
| 히어로 이미지는 lazy loading 금지 | LCP에 직접 영향 |
| 하단 이미지는 loading="lazy" | 초기 로드 최적화 |
| WebP/AVIF 포맷 | 파일 크기 감소 → LCP 개선 |

### 내부 링킹
| 규칙 | 이유 |
|------|------|
| 모든 페이지가 홈에서 3클릭 이내 도달 | 크롤링 효율성 |
| 관련 에디터 간 크로스 링크 | 페이지 권한(authority) 분산 |
| 설명적 앵커 텍스트 | Google이 링크 컨텍스트 이해 |
| 브레드크럼 네비게이션 | 사이트 구조 이해 + BreadcrumbList 스키마 |
| 고아 페이지 없음 | 내부 링크 없는 페이지는 크롤링 우선순위 최하위 |

### Next.js SEO 패턴
| 패턴 | 용도 |
|------|------|
| `generateMetadata()` | 동적 메타데이터 (title, description, canonical, OG) |
| `opengraph-image.tsx` | OG 이미지 자동 생성 (Satori/@vercel/og) |
| `twitter-image.tsx` | Twitter 카드 이미지 자동 생성 |
| `sitemap.ts` | 동적 사이트맵 생성 |
| `robots.ts` | robots.txt 생성 |
| `metadataBase` | 상대 URL → 절대 URL 변환 기준 |
| `generateStaticParams()` | 정적 페이지 생성 (ISR/SSG) |

---

## Phase 0: 지식 로드

1. 프로젝트 메모리의 `seo-lessons.md` 읽기 (없으면 skip)
2. `app/layout.tsx` 읽어 루트 metadata 파악
3. `next.config.ts` 읽어 설정 파악
4. app/ 디렉토리 스캔하여 현재 페이지 라우트 목록 파악

---

## Phase 1: 실행 옵션 결정

`$ARGUMENTS`를 파싱한다.

### 대상 페이지

| 인자 | 대상 |
|------|------|
| `home` | 홈/랜딩 (`app/page.tsx`) |
| `image-edit` | AI 이미지 편집 (`app/image-edit/`) |
| `retouching` | AI 피부 보정 (`app/retouching/`) |
| `face-edit` | AI 얼굴 변경 (`app/face-edit/`) |
| `pricing` | 요금제 (`app/pricing/`) |
| `all` 또는 인자 없음 | 모든 페이지 |

**페이지 자동 감지**: app/ 디렉토리를 스캔하여 존재하는 페이지 라우트 목록을 동적으로 파악한다.

### 실행 모드

| 키워드 | 모드 | 설명 |
|--------|------|------|
| `audit` | 감사만 | Phase 2만 실행, 수정 없음 |
| `fix` | 수정만 | Phase 3만 실행 (이전 감사 결과 기반) |
| `infinite` / `loop` / `auto` | 무한 루프 | Critical 0건까지 감사→수정→빌드→재감사 반복 |
| 키워드 없음 | 전체 실행 | Phase 2→3→4→5→6 순차 |

### 무한 루프 모드

```
반복 {
  1. Phase 2 (감사)
  2. Critical 0건이면 → 종료
  3. Phase 3 (자동 수정)
  4. yarn build 검증
  5. 빌드 실패 시 에러 수정
  6. 수정된 파일 중심 재감사
}
종료 후 → Phase 4~6
```

**원칙**:
- 기존 로직/디자인/기능을 **절대 해치지 않는** 선에서만 수정
- 수정 후 반드시 빌드 검증
- 각 라운드의 재감사는 수정된 파일 중심으로 실행
- 최종 리포트에 총 라운드 수와 수정된 이슈 목록을 포함

### 기본 실행 흐름

1. Phase 2: 감사 (11개 카테고리)
2. Phase 3: 자동 수정
3. Phase 4: 심층 최적화 (경쟁 키워드 + 콘텐츠 갭)
4. Phase 5: 인덱싱 확인
5. Phase 6: 학습 저장

대폭 변경이 필요한 경우에만 사용자 확인 후 진행.

---

## Phase 2: SEO 감사

### Step 1: 파일 수집

```
Glob: app/**/{page,layout}.tsx
Grep: application/ld+json (app/)
Glob: app/{sitemap,robots}.ts
Read: next.config.ts
Grep: <Image|<img (app/ 및 components/)
```

### Step 2: 11개 카테고리 감사

병렬 에이전트 3개로 효율적으로 감사:

- **에이전트 1**: 카테고리 1-4 (메타태그, 구조화 데이터, 언어/국제화, OG/Twitter)
- **에이전트 2**: 카테고리 5-7 (이미지, 내부 링킹, sitemap/robots)
- **에이전트 3**: 카테고리 8-11 (모바일, 접근성, 페이지 속도, 콘텐츠)

#### 카테고리 1: 메타태그 완전성

- [ ] `title` 존재 + 길이 적절 (30-60자 영문, 15-30자 CJK)
- [ ] `title`에 주요 키워드 포함
- [ ] `title` 페이지마다 고유
- [ ] `description` 존재 + 길이 적절 (70-160자 영문, 40-80자 CJK)
- [ ] `description`에 CTA + 키워드
- [ ] `alternates.canonical` 절대 URL
- [ ] canonical과 sitemap URL 일치
- [ ] robots 메타 적절 (실수 noindex 없는지)
- [ ] `metadataBase` 루트 레이아웃 설정
- [ ] title template 적절 (브랜드명 중복 없는지)

**참고**: [title-link](https://developers.google.com/search/docs/appearance/title-link), [snippet](https://developers.google.com/search/docs/appearance/snippet)

#### 카테고리 2: 구조화 데이터 (JSON-LD)

- [ ] Organization — 루트 레이아웃 (name, url, logo)
- [ ] WebApplication — 에디터 페이지 (name, description, url, applicationCategory, offers)
- [ ] BreadcrumbList — 모든 하위 페이지 (itemListElement)
- [ ] FAQPage — FAQ 있는 페이지 (mainEntity)
- [ ] HowTo — 사용법 있는 페이지 (name, step)
- [ ] JSON-LD 문법 오류 없음
- [ ] Rich Results Test 통과 가능 구조

**참고**: [구조화 데이터 개요](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [구조화 데이터 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

#### 카테고리 3: 언어 & 국제화 (글로벌 대응)

현재 한국어 기본이나 글로벌 확장을 고려한 검사:

- [ ] `<html lang="ko">` 설정 확인
- [ ] `og:locale` `ko_KR` 설정
- [ ] 메타데이터 언어 일관성
- [ ] 다국어 도입 시 hreflang 준비 상태 확인
  - x-default 설정 가능한 구조인지
  - URL 구조가 다국어 확장에 적합한지 (서브디렉토리 `/en/`, `/ja/` 등)
  - alternates.languages 설정 가능 여부
- [ ] 영문 title/description 병행 여부 (글로벌 검색 노출용)

**참고**: [국제화 SEO](https://developers.google.com/search/docs/specialty/international), [hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)

#### 카테고리 4: Open Graph / Twitter Cards

- [ ] og:title, og:description, og:url, og:type 존재
- [ ] og:image 존재 (1200x630px 이상)
- [ ] og:locale `ko_KR`
- [ ] og:site_name 존재
- [ ] twitter:card `summary_large_image`
- [ ] twitter:title, twitter:description 존재

#### 카테고리 5: 이미지 SEO

- [ ] 모든 이미지 alt 텍스트 존재
- [ ] alt 텍스트가 설명적 (125자 이내)
- [ ] 장식용 이미지는 `alt=""`
- [ ] width/height 또는 fill 지정 (CLS 방지)
- [ ] 히어로/LCP 이미지 priority 사용
- [ ] 하단 이미지 loading="lazy" (기본값)
- [ ] next/image 컴포넌트 사용 (자동 WebP/AVIF)

#### 카테고리 6: 내부 링킹

- [ ] 모든 에디터 홈에서 3클릭 이내 도달
- [ ] 에디터 간 크로스 링크 존재 (image-edit ↔ retouching ↔ face-edit)
- [ ] 브레드크럼 네비게이션 존재
- [ ] 푸터에 주요 페이지 링크
- [ ] 설명적 앵커 텍스트 ("여기를 클릭" 금지)
- [ ] 고아 페이지 없음
- [ ] Next.js `<Link>` 컴포넌트 사용

**참고**: [링크 모범 사례](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

#### 카테고리 7: Sitemap & robots.txt

- [ ] 모든 인덱싱 대상 페이지 사이트맵 포함
- [ ] `lastModified`가 실제 수정 날짜
- [ ] priority 논리적 (홈 1.0, 에디터 0.9, 가격 0.8, 법적 0.3)
- [ ] changeFrequency 적절
- [ ] sitemap URL = canonical URL
- [ ] robots.txt에 Sitemap 지시문
- [ ] CSS/JS/중요 페이지 미차단
- [ ] noindex 페이지가 사이트맵에 없음

**참고**: [사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

#### 카테고리 8: 모바일 반응성

- [ ] viewport 메타태그 (Next.js 기본 제공)
- [ ] 반응형 디자인 (Tailwind 반응형)
- [ ] 터치 타겟 >= 48x48px
- [ ] 수평 오버플로 없음
- [ ] 폰트 크기 최소 16px (모바일)
- [ ] 모바일/데스크톱 콘텐츠 동일 (모바일 우선 인덱싱)

**참고**: [모바일 우선 인덱싱](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)

#### 카테고리 9: 접근성 → SEO

- [ ] 시맨틱 HTML (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`)
- [ ] 헤딩 계층 (페이지당 단일 H1, h2→h3 순서)
- [ ] `<html lang="ko">`
- [ ] ARIA 랜드마크 (필요시)
- [ ] 폼 요소 label 연결
- [ ] 색상 대비 WCAG AA 이상

#### 카테고리 10: 페이지 속도 요인

- [ ] next/font 사용 (폰트 최적화)
- [ ] next/image 사용 (이미지 자동 최적화)
- [ ] App Router 기반 (자동 코드 분할)
- [ ] 불필요한 클라이언트 컴포넌트 없음
- [ ] third-party 스크립트 최소화

#### 카테고리 11: 콘텐츠 품질

- [ ] 씬 콘텐츠 감지 (본문 300자 미만)
- [ ] H1에 주요 키워드 포함
- [ ] 첫 문단에 키워드 포함
- [ ] 콘텐츠 구조화 (헤딩, 리스트, 단락)
- [ ] 한국어 자연스러운 표현
- [ ] "무료" 키워드 미사용 (유료 SaaS)
- [ ] 사용자 의도에 맞는 콘텐츠 (정보형 vs 도구형)

**참고**: [유용한 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

### Step 3: 감사 리포트

```markdown
## SEO 감사 리포트 — Phos AI

> 스캔 일시: {날짜}
> 대상: {N}개 페이지
> SEO 점수: {N}/100

### 요약
| 심각도 | 개수 | 설명 |
|--------|------|------|
| Critical | {n} | 즉시 수정 — 인덱싱/랭킹 직접 영향 |
| Warning | {n} | 권장 수정 — SEO 경쟁력 저하 |
| Info | {n} | 개선 가능 — 차별화 요소 |
| Good | {n} | 잘된 부분 |

### Critical
#### SEO-C{N}. {제목}
- **카테고리**: {해당 카테고리}
- **영향**: {구체적 영향}
- **현재**: {코드 현재 상태}
- **수정**: {구체적 방법}
- **근거**: {Google 문서 링크}
- **자동 수정**: 가능/불가

### Warning / Info / Good
(같은 형식)
```

### 심각도 기준

| 심각도 | 기준 | 예시 |
|--------|------|------|
| Critical | 인덱싱/랭킹 직접 영향 | canonical 누락, noindex 실수, 구조화 데이터 오류 |
| Warning | SEO 경쟁력 저하 | BreadcrumbList 누락, 내부 링킹 부족 |
| Info | 차별화 요소 | FAQPage 추가, 콘텐츠 강화, 글로벌 SEO 준비 |
| Good | 유지 필요 | OG 이미지, sitemap 설정 |

---

## Phase 3: 자동 수정

### Step 1: 우선순위 분류

| 우선순위 | 항목 | 방법 |
|---------|------|------|
| P1 | 메타태그 보완 | metadata 객체 수정 |
| P1 | 구조화 데이터 오류 수정 | JSON-LD 수정 |
| P1 | canonical/sitemap 불일치 | URL 통일 |
| P2 | 누락 구조화 데이터 추가 | Organization, WebApplication JSON-LD |
| P2 | 이미지 alt/priority 보완 | Image 컴포넌트 prop 추가 |
| P3 | 내부 크로스 링킹 강화 | 관련 에디터 링크 추가 |
| P3 | 콘텐츠 보강 제안 | 사용자 확인 후 적용 |

### Step 2: 코드 적용

1. `Read`로 최신 파일 확인
2. `Edit`으로 변경 적용
3. 변경 기록

### Step 3: 빌드 검증

```bash
yarn build
```

빌드 실패 시 에러 분석 후 수정.

### Step 4: 수정 리포트

```markdown
## 자동 수정 완료

### 적용된 수정 ({n}개)
| # | 이슈 ID | 파일 | 수정 내용 |
|---|---------|------|-----------|
| 1 | SEO-C1 | {파일} | {내용} |

### 새로 생성된 파일
| 파일 | 역할 |
|------|------|
| {경로} | {설명} |

### 빌드: {성공/실패}
```

---

## Phase 4: 심층 최적화

### Step 1: 경쟁 키워드 분석

WebSearch로 한국어 + 영문 대상 키워드의 상위 결과 분석:

```
# 한국어 키워드
WebSearch: "AI 사진 보정 온라인"
WebSearch: "AI 이미지 편집 도구"
WebSearch: "AI 피부 보정"
WebSearch: "AI 얼굴 보정"

# 글로벌 키워드
WebSearch: "AI photo retouching online"
WebSearch: "AI image editing tool"
WebSearch: "AI face editing"
WebSearch: "AI skin retouching"
```

분석 항목:
- title/description 패턴
- H1 태그
- 콘텐츠 구조 (FAQ, How-to, 비교표 등)
- 구조화 데이터 타입
- 페이지 콘텐츠 길이

### Step 2: 콘텐츠 갭 분석

```markdown
### 콘텐츠 갭 — {페이지명}
| 요소 | 우리 | 경쟁사 비율 | 조치 |
|------|------|-----------|------|
| FAQ 섹션 | ? | ?/10 | ? |
| How-to | ? | ?/10 | ? |
| 기능 비교표 | ? | ?/10 | ? |
```

### Step 3: 최적화 적용

- Title/Description CTR 최적화 (경쟁사 패턴 참고)
- 구조화 데이터 보강 (FAQPage, HowTo)
- 내부 링킹 강화
- **대폭 콘텐츠 변경은 사용자 확인 후**

---

## Phase 5: 인덱싱 확인

WebSearch로 `site:` 쿼리:

```
WebSearch: site:phos.studio
WebSearch: site:phos.studio/image-edit
WebSearch: site:phos.studio/retouching
WebSearch: site:phos.studio/face-edit
WebSearch: site:phos.studio/pricing
```

```markdown
## 인덱싱 리포트

> 확인 일시: {날짜}

### 현황
| 페이지 | 인덱싱 | 비고 |
|--------|--------|------|
| Home | ? | — |
| Image Edit | ? | — |
| Retouching | ? | — |
| Face Edit | ? | — |
| Pricing | ? | — |

### 권장 조치
- {항목}
```

---

## Phase 6: 학습 저장

새로 발견한 SEO 패턴/교훈을 프로젝트 메모리 `seo-lessons.md`에 저장한다.

---

## 절대 하지 않는 것

- "무료" 키워드 사용 — Phos AI는 유료 SaaS
- 키워드 스터핑(과도한 키워드 삽입) — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 숨겨진 텍스트/링크 추가 — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 클로킹 (사용자/크롤러 다른 콘텐츠)
- 커밋 — `/commit-and-push`로 별도
- 사용자 확인 없이 대폭 콘텐츠 변경
- robots.txt Disallow 추가는 반드시 사용자 확인
- SEO를 위해 UX 해치기 — Google도 이를 부정적으로 평가
