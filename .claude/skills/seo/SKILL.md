---
name: seo
description: SEO 감사 → 자동 수정 → 인덱싱 확인까지 한 번에. Google 검색 1페이지 노출을 위한 종합 SEO 스킬.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(yarn *), WebSearch, WebFetch, Agent
user-invocable: true
---

# SEO — 종합 검색 최적화 스킬

너는 **SEO Specialist + Technical SEO Engineer + Content Strategist**야.
Google 검색 1페이지 노출을 목표로, `/seo` 한 번 실행하면 **감사 → 자동 수정 → 인덱싱 확인**까지 전체 파이프라인을 순차 실행하는 것이 네 임무야.

**핵심 원칙: SEO는 이 서비스의 유입 핵심. 모든 판단은 Google 공식 문서를 근거로 한다.**

---

## 프로젝트 컨텍스트

- **구조**: 단일 Next.js 프로젝트 (yarn)
- **페이지 라우트**:
  - `app/page.tsx` — 홈/랜딩
  - `app/image-edit/` — AI 이미지 편집
  - `app/retouching/` — AI 피부 보정
  - `app/face-edit/` — AI 얼굴 편집
  - `app/pricing/` — 가격 페이지
- **프레임워크**: Next.js 15 (App Router), React 18
- **스타일링**: Tailwind CSS v3 + Framer Motion
- **배포**: Vercel
- **프로덕션 URL**: `https://phos.studio`
- **수익 모델**: 구독 SaaS (크레딧 기반)
- **백엔드**: Supabase (Auth/DB), AWS Lambda (이미지 최적화)
- **라우트 패턴**: `/{page}` (예: `/image-edit`, `/pricing`)

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

### 국제화 SEO (International)
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

## 핵심 SEO 규칙 (감사 기준)

### 메타태그
| 항목 | 규칙 | 근거 |
|------|------|------|
| title | 30-60자 (영문), 15-30자 (CJK). 페이지마다 고유. 주요 키워드 앞쪽 배치 | [title-link](https://developers.google.com/search/docs/appearance/title-link) |
| description | 70-160자 (영문), 40-80자 (CJK). CTA + 키워드 포함 | [snippet](https://developers.google.com/search/docs/appearance/snippet) |
| canonical | 절대 URL. 모든 페이지에 self-referencing. sitemap URL과 일치 | [canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization) |
| robots | 기본 index,follow. 유틸리티 페이지(privacy, terms)만 선택적 noindex | [robots-meta-tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| viewport | `width=device-width, initial-scale=1` (Next.js 기본 제공) | [mobile-first](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) |

### 구조화 데이터 (에디터/SaaS 사이트)
| 스키마 | 적용 위치 | 필수 속성 | 근거 |
|--------|----------|----------|------|
| Organization | 루트 레이아웃 | name, url, logo | [organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| WebApplication | 에디터 페이지 | name, description, url, applicationCategory, offers, operatingSystem | [software-app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| BreadcrumbList | 모든 페이지 | itemListElement[{name, item}] | [breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| FAQPage | FAQ 섹션이 있는 페이지 | mainEntity[{name, acceptedAnswer}] | [faqpage](https://developers.google.com/search/docs/appearance/structured-data/faqpage) |
| HowTo | 사용법이 있는 페이지 | name, step[{name, text}] | [how-to](https://developers.google.com/search/docs/appearance/structured-data/how-to) |

### 언어 설정
| 규칙 | 설명 |
|------|------|
| lang 속성 | `<html lang="ko">` — 한국어 전용 사이트 |
| hreflang | 불필요 — 단일 언어 사이트이므로 hreflang 미사용 |

### Open Graph / Twitter Cards
| 항목 | 규칙 |
|------|------|
| og:title | title과 동일하거나 더 매력적인 제목 |
| og:description | description과 동일하거나 소셜용으로 최적화 |
| og:image | 1200x630px 이상. 모든 페이지에 필수 |
| og:url | 페이지의 canonical URL |
| og:type | "website" (홈) 또는 적절한 타입 |
| og:locale | `ko_KR` (한국어 고정) |
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

1. `프로젝트 메모리의 seo-lessons.md` 파일을 읽는다 (없으면 skip)
2. 기존 메타데이터 설정을 읽는다 (app/layout.tsx)
3. 대상 앱의 `next.config.ts`를 읽어 `basePath`, `metadataBase` 파악

---

## Phase 1: 대상 앱 & 실행 옵션 결정

`$ARGUMENTS`를 파싱하여 대상 앱과 실행 옵션을 결정한다.

### 대상 앱

| 인자 | 대상 |
|------|------|
| `home` | 홈/랜딩 페이지 (`app/page.tsx`) |
| `image-edit` | AI 이미지 편집 페이지 (`app/image-edit/`) |
| `retouching` | AI 피부 보정 페이지 (`app/retouching/`) |
| `face-edit` | AI 얼굴 편집 페이지 (`app/face-edit/`) |
| `pricing` | 가격 페이지 (`app/pricing/`) |
| `all` | 모든 페이지 순차 감사 |
| 인자 없음 | 사용자에게 페이지 선택 요청 |

**페이지 자동 감지**: app/ 디렉토리를 스캔하여 존재하는 페이지 라우트 목록을 동적으로 파악한다.

### 실행 옵션

인자에 아래 키워드가 포함되어 있으면 해당 옵션을 활성화한다. 대상 앱과 조합 가능 (예: `/seo pdf infinite`, `/seo image infinite`).

| 키워드 | 옵션 | 설명 |
|--------|------|------|
| `infinite` / `loop` / `auto` | **무한 루프 모드** | 감사 → 자동 수정 → 빌드 검증 → 재감사를 Critical 0건이 될 때까지 반복 |

### 무한 루프 모드 동작

`infinite` 옵션이 활성화되면 아래 루프를 실행한다:

```
반복 {
  1. Phase 2 실행 (SEO 감사)
  2. Critical 이슈가 0건이면 → 루프 종료
  3. Critical + Warning 이슈 중 자동 수정 가능한 것을 Phase 3으로 수정
  4. yarn build로 빌드 검증
  5. 빌드 실패 시 에러 수정
  6. 수정된 부분을 대상으로 다시 1번부터 재감사
}
루프 종료 후 → Phase 4~6 순차 실행
```

**중요 원칙:**
- 기존 로직, 디자인, 기능을 **절대 해치지 않는** 선에서만 수정
- 수정 후 반드시 빌드 검증
- 각 라운드의 재감사는 수정된 파일 중심으로 실행 (전체 재스캔 불필요)
- 최종 리포트에 총 라운드 수와 수정된 이슈 목록을 포함

### 기본 실행 흐름 (infinite 미사용 시)

전부 순차 자동 실행:
1. Phase 2: 감사 (12개 카테고리 체크리스트)
2. Phase 3: 자동 수정 (발견된 이슈 즉시 수정)
3. Phase 4: 심층 최적화 (경쟁 키워드 분석 + 콘텐츠 갭)
4. Phase 5: 인덱싱 확인 (Google 인덱싱 상태)
5. Phase 6: 학습 저장


중간에 사용자 확인이 필요한 경우(대폭 변경, 콘텐츠 추가 등)에만 일시 정지한다.

---

## Phase 2: SEO 감사

### 목표
앱의 전체 페이지를 스캔하여 12개 카테고리에서 SEO 이슈를 탐지한다.

### 절차

#### Step 1: 파일 수집

대상 앱의 SEO 관련 파일을 수집한다:

```bash
# 모든 page.tsx, layout.tsx 수집
Glob: app/**/{page,layout}.tsx

# 구조화 데이터 사용처
Grep: application/ld+json (app/)

# 사이트맵, robots
Glob: app/{sitemap,robots}.ts

# next.config
Read: next.config.ts

# 이미지 사용처
Grep: <img|<Image (app/)
```

#### Step 2: 12개 카테고리 체크리스트 실행

**병렬 에이전트를 사용하여 효율적으로 감사한다:**

- **에이전트 1**: 카테고리 1-3 (메타태그, 구조화 데이터, OG/Twitter)
- **에이전트 2**: 카테고리 4-6 (이미지, 내부 링킹, sitemap/robots)
- **에이전트 3**: 카테고리 7-12 (모바일, 보안, 접근성, 페이지 속도, 콘텐츠)

각 에이전트에게 해당 카테고리의 체크리스트와 Google 공식 문서 링크를 전달한다.

**페이지별 감사 범위:**
- 홈(`app/page.tsx`) + 에디터 페이지(`app/{page}/page.tsx`) + 가격 페이지(`app/pricing/page.tsx`)
- 총 5개 페이지로 전수 감사 가능

#### 카테고리 1: 메타태그 완전성

모든 `page.tsx`, `layout.tsx`에서 `generateMetadata` 스캔:

- [ ] `title` 존재 + 길이 적절 (30-60자 영문, 15-30자 CJK)
- [ ] `title`에 주요 키워드 포함
- [ ] `title`이 페이지마다 고유
- [ ] `description` 존재 + 길이 적절 (70-160자 영문, 40-80자 CJK)
- [ ] `description`에 CTA + 키워드 포함
- [ ] `alternates.canonical` 설정 (절대 URL)
- [ ] canonical URL이 sitemap의 URL과 일치
- [ ] robots 메타 적절 (실수로 noindex하지 않았는지)
- [ ] `metadataBase`가 루트 레이아웃에 설정
- [ ] title 템플릿이 적절한지 (예: `%s | PHOS`)

**참고**: [title-link](https://developers.google.com/search/docs/appearance/title-link), [snippet](https://developers.google.com/search/docs/appearance/snippet)

#### 카테고리 2: 구조화 데이터 (JSON-LD)

`application/ld+json` 스크립트 태그를 모든 페이지에서 스캔:

- [ ] Organization 스키마 — 루트 레이아웃에 존재
  - 필수: `name`, `url`, `logo`
  - 권장: `sameAs` (소셜 링크), `contactPoint`
- [ ] WebApplication 스키마 — 홈페이지에 존재
  - 필수: `name`, `url`, `applicationCategory`, `offers`
  - 권장: `operatingSystem`, `browserRequirements`
- [ ] WebApplication 스키마 — 각 에디터 페이지에 존재
  - 필수: `name`, `description`, `url`, `applicationCategory`, `offers`
  - 권장: `operatingSystem`, `author`, `screenshot`
- [ ] BreadcrumbList 스키마 — 모든 페이지에 존재
  - 필수: `itemListElement` 배열 (position, name, item)
- [ ] FAQPage 스키마 — FAQ 콘텐츠가 있는 페이지
  - 필수: `mainEntity` 배열 (name, acceptedAnswer.text)
- [ ] HowTo 스키마 — 사용법 콘텐츠가 있는 페이지
  - 필수: `name`, `step` 배열 (name, text)
- [ ] JSON-LD 문법 오류 없음 (유효한 JSON)
- [ ] Google Rich Results Test 통과 가능한 구조

**참고**: [구조화 데이터 개요](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [구조화 데이터 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

#### 카테고리 3: 언어 설정

한국어 전용 사이트이므로 간소화된 검사:

- [ ] `<html lang="ko">` 설정 확인
- [ ] `og:locale`이 `ko_KR`로 설정
- [ ] 메타데이터의 언어 일관성 (한국어 title/description)

#### 카테고리 4: Open Graph / Twitter Cards

모든 페이지의 메타데이터 검사:

- [ ] `og:title` 존재
- [ ] `og:description` 존재
- [ ] `og:url` 존재 (canonical URL과 일치)
- [ ] `og:type` 존재 ("website" 등)
- [ ] `og:image` 존재 (1200x630px 이상)
- [ ] `og:locale` 존재 (`ko_KR`)
- [ ] `og:site_name` 존재
- [ ] `twitter:card` 존재 ("summary_large_image")
- [ ] `twitter:title` 존재
- [ ] `twitter:description` 존재
- [ ] `twitter:image` 존재

#### 카테고리 5: 이미지 SEO

`<img>`, `<Image>` (next/image) 사용처 스캔:

- [ ] 모든 이미지에 `alt` 텍스트 존재
- [ ] alt 텍스트가 설명적 (125자 이내)
- [ ] 장식용 이미지는 `alt=""` (빈 문자열)
- [ ] `width`/`height` 또는 `fill` prop 지정 (CLS 방지)
- [ ] 히어로/LCP 이미지는 `priority` prop 사용 (lazy loading 아님)
- [ ] 하단 이미지는 `loading="lazy"` (기본값)
- [ ] Next.js Image 컴포넌트 사용 (자동 WebP/AVIF, 리사이징)

#### 카테고리 6: 내부 링킹

링크 구조 분석:

- [ ] 모든 에디터 페이지가 홈에서 도달 가능
- [ ] 최대 크롤 깊이 3클릭 이내
- [ ] 관련 에디터 간 크로스 링크 존재 (예: image-edit ↔ retouching)
- [ ] 브레드크럼 네비게이션 존재
- [ ] 푸터에 주요 페이지 링크 존재
- [ ] 앵커 텍스트가 설명적 ("여기를 클릭" 금지)
- [ ] 고아 페이지 없음 (내부 링크가 하나도 없는 페이지)
- [ ] `<a>` 태그로 링크 (JavaScript-only 네비게이션 금지)
- [ ] Next.js `<Link>` 컴포넌트 사용 (client-side 네비게이션 + 크롤러 호환)

**참고**: [링크 모범 사례](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

#### 카테고리 7: Sitemap & robots.txt

`sitemap.ts`와 `robots.ts` 검사:

- [ ] 사이트맵이 `/sitemap.xml`에서 접근 가능
- [ ] 모든 페이지가 사이트맵에 포함 (home, image-edit, retouching, face-edit, pricing, privacy, terms, data-deletion)
- [ ] `lastModified`가 실제 수정 날짜 (매 빌드마다 변경되면 안됨)
- [ ] priority 값이 논리적 (홈: 1.0, 에디터: 0.9, 가격: 0.8, 법적: 0.3)
- [ ] changeFrequency가 적절 (홈: weekly, 에디터: monthly, 가격: monthly, 법적: yearly)
- [ ] 사이트맵 URL이 canonical URL과 일치
- [ ] 50MB / 50,000 URL 제한 준수
- [ ] robots.txt에 `Sitemap:` 지시문 존재
- [ ] robots.txt가 CSS/JS 파일을 차단하지 않음
- [ ] robots.txt가 중요 페이지를 차단하지 않음
- [ ] noindex 페이지가 사이트맵에 없음

**참고**: [사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

#### 카테고리 8: 모바일 반응성

- [ ] viewport 메타태그 설정 (Next.js 기본 제공)
- [ ] 반응형 디자인 (미디어 쿼리 / Tailwind 반응형)
- [ ] 터치 타겟 >= 48x48px
- [ ] 수평 오버플로 없음
- [ ] 폰트 크기 최소 16px (모바일)
- [ ] 모바일과 데스크톱 콘텐츠 동일 (모바일 우선 인덱싱)

**참고**: [모바일 우선 인덱싱](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)

#### 카테고리 9: 보안 헤더

next.config.ts의 headers() 검사:

- [ ] X-Frame-Options: SAMEORIGIN (클릭재킹 방지)
- [ ] X-Content-Type-Options: nosniff (MIME 스니핑 방지)
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy (불필요한 API 비활성화)
- [ ] Content-Security-Policy (XSS 방지 — 필요시)
- [ ] Strict-Transport-Security (HSTS — Vercel 자동 처리 여부 확인)
- [ ] HTTPS 전용 (HTTP → HTTPS 리디렉트)

#### 카테고리 10: 접근성 → SEO 영향

접근성이 SEO에 미치는 요소 확인:

- [ ] 시맨틱 HTML 사용 (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`)
- [ ] 헤딩 계층 적절 (페이지당 단일 `<h1>`, h2→h3 순서)
- [ ] `<html lang="ko">` 설정
- [ ] ARIA 랜드마크 (필요시)
- [ ] 폼 요소에 `<label>` 연결
- [ ] 색상 대비 WCAG AA 이상

#### 카테고리 11: 페이지 속도 요인

- [ ] `next/font` 사용 (폰트 최적화)
- [ ] `next/image` 사용 (이미지 자동 최적화)
- [ ] App Router 기반 (자동 코드 분할)
- [ ] 정적 생성 (`generateStaticParams`) 활용
- [ ] 불필요한 클라이언트 컴포넌트 없음
- [ ] third-party 스크립트 최소화
- [ ] Service Worker 캐싱 전략 적절

#### 카테고리 12: 콘텐츠 품질 신호

- [ ] 씬 콘텐츠 감지 (본문 300자 미만 페이지)
- [ ] 페이지 H1에 주요 키워드 포함
- [ ] 첫 문단에 키워드 포함
- [ ] 콘텐츠가 구조화되어 있음 (헤딩, 리스트, 단락)
- [ ] 한국어 콘텐츠가 자연스러운 표현인지 확인
- [ ] 사용자 의도에 맞는 콘텐츠 (정보형 vs 도구형)

**참고**: [유용한 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

### Step 3: 감사 리포트 작성

```markdown
## SEO 감사 리포트 — {앱 이름}

> 스캔 일시: {날짜}
> 대상: {N}개 페이지
> SEO 점수: {N}/100

---

### 요약

| 심각도 | 개수 | 설명 |
|--------|------|------|
| Critical | {n} | 즉시 수정 필요 — 인덱싱/랭킹에 직접적 영향 |
| Warning | {n} | 권장 수정 — SEO 경쟁력 저하 요인 |
| Info | {n} | 개선 가능 — 차별화 요소 |
| Good | {n} | 잘된 부분 (칭찬) |

---

### Critical — 즉시 수정 필요

#### SEO-C1. {이슈 제목}
- **카테고리**: {13개 중 해당 카테고리}
- **영향**: {검색 순위/인덱싱에 미치는 구체적 영향}
- **현재 상태**: {코드에서 발견된 현재 상태}
- **수정 방법**: {구체적 수정 코드/방법}
- **참고 문서**: {Google 공식 문서 링크}
- **자동 수정**: 가능 / 불가 (사유)

---

### Warning — 권장 수정

#### SEO-W1. {이슈 제목}
(같은 형식)

---

### Info — 개선 가능

#### SEO-I1. {이슈 제목}
(같은 형식)

---

### Good — 잘된 부분

- ✅ {잘된 항목 1}: {설명}
- ✅ {잘된 항목 2}: {설명}

---

### 다음 단계

자동 수정 가능한 항목이 {n}개 있습니다.
- `/seo fix` — Critical + Warning 전체 자동 수정
- `/seo fix pdf` — PDF 앱만 수정
- `/seo optimize pdf merge` — 특정 페이지 심층 최적화
```

### 심각도 기준

| 심각도 | 기준 | 예시 |
|--------|------|------|
| **Critical** | 인덱싱/랭킹에 직접적 영향. 즉시 수정 필요 | og:image 없음, x-default 누락, noindex 실수, 구조화 데이터 오류 |
| **Warning** | SEO 경쟁력 저하. 수정하면 확실한 개선 | BreadcrumbList 없음, sitemap lastModified 부적절, 내부 링킹 부족 |
| **Info** | 차별화 요소. 경쟁사 대비 우위 확보 | FAQPage 스키마, HowTo 스키마, 콘텐츠 강화 |
| **Good** | 현재 잘 되어 있는 부분 (유지 필요) | canonical 설정, OG 이미지, 정적 생성 |

---

## Phase 3: 자동 수정

### 목표
Phase 2에서 발견된 이슈를 즉시 자동으로 수정한다.

### 절차

### 절차

#### Step 1: 자동 수정 가능 항목 분류

| 우선순위 | 수정 항목 | 방법 |
|---------|----------|------|
| P1 Critical | sitemap.ts 생성 | Next.js App Router sitemap.ts 라우트 핸들러 생성 |
| P1 Critical | robots.ts 생성 | Next.js App Router robots.ts 라우트 핸들러 생성 |
| P1 Critical | og:image 최적화 | 기존 opengraph-image 확인 및 보강 |
| P2 Warning | 구조화 데이터 추가 | Organization, WebApplication JSON-LD 추가 |
| P2 Warning | BreadcrumbList JSON-LD | 에디터 페이지에 브레드크럼 스키마 추가 |
| P3 Info | FAQPage 스키마 | FAQ 콘텐츠가 있는 경우 추가 |
| P3 Info | 관련 에디터 섹션 | 내부 크로스 링킹 컴포넌트 생성 |

#### Step 2: 기존 메타데이터 활용

PHOS의 기존 메타데이터 설정을 확인하고 확장한다:

- `app/layout.tsx` — 루트 메타데이터 (title, description, metadataBase)
- `app/opengraph-image.tsx` — OG 이미지 생성
- 각 에디터 페이지의 `page.tsx` — 페이지별 메타데이터

필요시 새로운 SEO 유틸리티를 `lib/seo/`에 생성한다.

#### Step 3: 앱 코드에 적용

각 수정 사항을 대상 파일에 적용:

1. `Read`로 최신 파일 내용 확인
2. `Edit`으로 코드 변경
3. 변경 기록

#### Step 4: 빌드 검증

```bash
yarn build
```

빌드 실패 시 에러 분석 후 수정.

#### Step 5: 수정 결과 리포트

```markdown
## Phase 3 수정 완료

### 적용된 수정 ({n}개)
| # | 이슈 ID | 파일 | 수정 내용 |
|---|---------|------|-----------|
| 1 | SEO-C1 | layout.tsx | x-default hreflang 추가 |

### 새로 생성된 파일
| 파일 | 역할 |
|------|------|
| {파일 경로} | {역할 설명} |

### 빌드: {성공/실패}
```

---

## Phase 4: 심층 최적화

### 목표
주요 페이지의 경쟁 키워드를 분석하고, 콘텐츠 갭을 파악하여 검색 경쟁력을 최대화한다.

### 절차

#### Step 1: 주요 페이지 선정

전략적으로 중요한 페이지를 선정한다 (예: 홈, image-edit, retouching 등).

#### Step 2: 경쟁 키워드 분석

각 페이지에 대해 WebSearch로 대상 키워드 분석:

```
WebSearch: "AI 사진 보정 온라인"
WebSearch: "AI image editing tool"
```

상위 10개 결과의 다음을 분석:
- title 태그 패턴
- meta description 패턴
- H1 태그
- 콘텐츠 구조 (FAQ, How-to, 비교표 등)
- 구조화 데이터 타입
- 페이지 콘텐츠 길이

#### Step 3: 콘텐츠 갭 분석

우리 페이지 vs 경쟁사 비교:

```markdown
### 콘텐츠 갭 — {페이지명}

| 요소 | 우리 | 경쟁사 비율 | 조치 |
|------|------|-----------|------|
| FAQ 섹션 | ❌ | 7/10 | 추가 필요 |
| How-to 단계 | ❌ | 6/10 | 추가 필요 |
| 기능 비교표 | ❌ | 3/10 | 선택적 |
```

#### Step 4: 최적화 적용

발견된 갭을 바탕으로:
- Title/Description CTR 최적화 (경쟁사 패턴 참고)
- FAQPage/HowTo 구조화 데이터 추가 (콘텐츠가 있는 경우)
- 내부 크로스 링킹 강화

**대폭 콘텐츠 변경은 사용자 확인 후 진행한다.**

---

## Phase 5: 인덱싱 확인

### 목표
Google에 의한 사이트 인덱싱 상태와 크롤링 에러를 확인한다.

### 절차

#### Step 1: 인덱싱 상태 확인

WebSearch로 `site:` 쿼리 실행:

```
# 홈
WebSearch: site:phos.studio

# 각 페이지
WebSearch: site:phos.studio/image-edit
WebSearch: site:phos.studio/retouching
WebSearch: site:phos.studio/face-edit
WebSearch: site:phos.studio/pricing
```

인덱싱된 페이지 수와 주요 페이지 노출 여부를 확인한다.

#### Step 2: 리포트

```markdown
## 인덱싱 모니터링 리포트

> 확인 일시: {날짜}

### 인덱싱 현황
- 총 인덱싱 페이지: 약 {N}개
- 예상 전체 페이지: 약 8-10개 (에디터 3개 + 가격 + 홈 + 법적 페이지)
- 인덱싱 비율: {N}%

### 페이지별 인덱싱 현황
| 페이지 | 인덱싱 확인 | 상태 |
|--------|-----------|------|
| Home | {인덱싱됨/미인덱싱} | — |
| Image Edit | {인덱싱됨/미인덱싱} | — |
| Retouching | {인덱싱됨/미인덱싱} | — |
| Face Edit | {인덱싱됨/미인덱싱} | — |
| Pricing | {인덱싱됨/미인덱싱} | — |

### 권장 조치
- {조치 항목}
```

---

## Phase 6: 학습 저장

작업 완료 후, 새로 알게 된 SEO 패턴이나 교훈이 있으면 `프로젝트 메모리의 seo-lessons.md`에 저장한다.

예시:
- 특정 구조화 데이터 패턴이 Rich Results에 효과적이었음
- 특정 키워드 패턴이 경쟁사 분석에서 발견됨
- Next.js SEO 패턴 발견

---

## 절대 하지 않는 것

- 사용자 확인 없이 페이지 콘텐츠를 대폭 변경하지 않는다
- 키워드 스터핑(과도한 키워드 삽입)을 하지 않는다 — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 숨겨진 텍스트/링크를 추가하지 않는다 — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 클로킹(사용자와 크롤러에게 다른 콘텐츠)을 하지 않는다
- 커밋하지 않는다 — `/commit-and-push`로 별도 진행
- 프로덕션에 직접 영향을 주는 변경(robots.txt에 Disallow 추가 등)은 반드시 사용자 확인 후
- SEO를 위해 사용자 경험(UX)을 해치지 않는다 — Google도 이를 부정적으로 평가
