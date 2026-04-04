---
name: seo
description: SEO 감사 → 자동 수정 → 인덱싱 확인까지 한 번에. Google 검색 1페이지 노출을 위한 종합 SEO 스킬.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(yarn *), Bash(npx *), WebSearch, WebFetch, Agent
user-invocable: true
---

# SEO — 종합 검색 최적화 스킬

너는 **SEO Specialist + Technical SEO Engineer + Content Strategist**야.
Google 검색 1페이지 노출을 목표로, `/seo` 한 번 실행하면 **감사 → 자동 수정 → 인덱싱 확인**까지 전체 파이프라인을 순차 실행하는 것이 네 임무야.

**핵심 원칙: SEO는 이 서비스의 유입 핵심. 모든 판단은 Google 공식 문서를 근거로 한다.**

---

## 프로젝트 컨텍스트

- **프레임워크**: Next.js 15 (App Router), React 18, Tailwind CSS v3, Framer Motion
- **배포**: Vercel
- **프로덕션 URL**: `https://phos.studio`
- **수익 모델**: 구독 SaaS (Polar — 구독 + 크레딧 팩)
- **백엔드**: Supabase (Auth/DB)
- **빌드**: `yarn build`
- **i18n**: 11개 로케일 — `en`, `zh`, `es`, `ar`, `pt`, `fr`, `ja`, `ru`, `de`, `id`, `ko`
  - **en이 기본이자 1순위** — 영미권 타겟, en.ts 카피 품질이 최우선
  - `ar`은 RTL (`dir="rtl"`) 지원
  - `[locale]` 동적 세그먼트로 라우팅
- **이미지 CDN**: `https://images.phos.studio` (Cloudflare R2)

### 금지 키워드

**"무료" 키워드는 어떤 로케일에서도 절대 사용하지 않는다.** Phos AI는 유료 SaaS이다. "free", "무료", "免费", "無料", "бесплатно", "gratis", "gratuit" 등 모든 언어에서 금지.

### 페이지 인벤토리 (9개 페이지, 모두 `app/[locale]/` 하위)

| 라우트 | 타입 | 설명 |
|--------|------|------|
| `/[locale]/` | Landing (SSR) | Hero, 기능 쇼케이스, 가격 미리보기 |
| `/[locale]/image-edit` | Tool ("use client") | AI 이미지 편집 (프롬프트 + 참조 이미지 → 생성) |
| `/[locale]/retouching` | Tool ("use client") | AI 피부 보정 |
| `/[locale]/face-edit` | Tool ("use client") | AI 얼굴 편집 (마스크 → 생성) |
| `/[locale]/pricing` | Mixed | 구독 플랜 + 크레딧 팩 + FAQ |
| `/[locale]/contact` | Page | 문의 폼 |
| `/[locale]/privacy` | Legal | 개인정보처리방침 |
| `/[locale]/terms` | Legal | 이용약관 |
| `/[locale]/data-deletion` | Legal | 데이터 삭제 (GDPR) |

### 현재 SEO 인프라 (이미 구현된 것)

감사 전에 현재 상태를 반드시 코드를 읽어 최신 상태로 파악한다:

- `app/[locale]/layout.tsx` — 레이아웃 수준 `generateMetadata` (title 템플릿 `%s — Phos AI`, description, metadataBase `https://phos.studio`, openGraph, twitter, alternates 11 로케일 + x-default)
- `app/opengraph-image.tsx` — 루트 OG 이미지 (1200x630, Edge Runtime, Satori)
- `app/icon.tsx`, `app/apple-icon.tsx` — 파비콘/애플 아이콘
- `lib/i18n/dictionaries/*.ts` — 각 로케일별 metadata 키 (siteTitle, siteDescription, imageEditTitle, imageEditDescription, retouchingTitle, retouchingDescription, faceEditTitle, faceEditDescription, pricingTitle, pricingDescription, contactTitle, contactDescription)
- `app/[locale]/layout.tsx` — `generateStaticParams` (11 로케일)
- `middleware.ts` — 로케일 감지 + 리디렉트 (307) + RTL 헤더

### 알려진 SEO 갭 (누락 항목)

| 항목 | 상태 | 심각도 |
|------|------|--------|
| `sitemap.ts` | 없음 | Critical |
| `robots.ts` | 없음 | Critical |
| 페이지별 `generateMetadata` | 없음 (모든 페이지가 레이아웃 기본값 사용) | Critical |
| `<html lang>` 서버사이드 | 클라이언트 스크립트로만 설정 (크롤러에 안 보임) | Critical |
| hreflang 경로 버그 | 레이아웃 alternates가 로케일 루트만 가리킴 (페이지 경로 미포함) | Critical |
| 구조화 데이터 (JSON-LD) | 없음 | Warning |
| 페이지별 OG 이미지 | 없음 (루트 OG만 존재) | Warning |
| `twitter-image.tsx` | 없음 | Warning |
| 보안 헤더 | 이미지 캐시 헤더만 존재 | Warning |
| `lib/seo/` 유틸리티 | 없음 | Info |

### "use client" 페이지의 metadata 패턴

Tool 페이지(image-edit, retouching, face-edit)는 `"use client"`이므로 `generateMetadata`를 직접 export 할 수 없다.
**해결법**: 각 도구 디렉토리에 서버 컴포넌트 `layout.tsx`를 생성하여 `generateMetadata`를 export한다.

```
app/[locale]/image-edit/
├── layout.tsx          ← 새로 생성: generateMetadata + JSON-LD
└── page.tsx            ← 기존 "use client" (변경 없음)
```

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
| robots | 기본 index,follow. 법적 페이지(privacy, terms, data-deletion)만 선택적 noindex | [robots-meta-tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) |
| viewport | `width=device-width, initial-scale=1` (Next.js 기본 제공) | [mobile-first](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing) |

### 구조화 데이터 (SaaS 에디터)
| 스키마 | 적용 위치 | 필수 속성 | 근거 |
|--------|----------|----------|------|
| Organization | 루트 레이아웃 | name, url, logo | [organization](https://developers.google.com/search/docs/appearance/structured-data/organization) |
| WebApplication | 랜딩 페이지 | name, url, applicationCategory("Multimedia"), offers | [software-app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| SoftwareApplication | 도구 페이지 (image-edit, retouching, face-edit) | name, description, url, applicationCategory, offers, operatingSystem("Any"), author | [software-app](https://developers.google.com/search/docs/appearance/structured-data/software-app) |
| BreadcrumbList | 모든 하위 페이지 | itemListElement[{name, item}] | [breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb) |
| FAQPage | Pricing 페이지 (FAQ 섹션 존재) | mainEntity[{name, acceptedAnswer}] | [faqpage](https://developers.google.com/search/docs/appearance/structured-data/faqpage) |

### hreflang (11개 로케일)
| 규칙 | 설명 |
|------|------|
| 전체 로케일 링크 | 모든 페이지에서 11개 로케일 변형 전부에 링크 |
| x-default | `/en/{path}` 지정 (영어가 기본) |
| self-referencing | 자기 자신 로케일에 대한 hreflang도 반드시 포함 |
| **경로 포함** | `/ko/image-edit`의 hreflang은 `/en/image-edit`, `/zh/image-edit` 등이어야 함 (로케일 루트 아님) |
| ISO 639-1 | 언어 코드 준수 (ko, en, ja, zh 등) |
| 양방향 | A→B 링크가 있으면 B→A도 존재 |
| 절대 URL | metadataBase (`https://phos.studio`) + 경로 |

### Open Graph / Twitter Cards
| 항목 | 규칙 |
|------|------|
| og:title | title과 동일하거나 더 매력적인 제목 |
| og:description | description과 동일하거나 소셜용으로 최적화 |
| og:image | 1200x630px 이상. 모든 페이지에 필수 |
| og:url | 페이지의 canonical URL |
| og:type | "website" (홈) 또는 적절한 타입 |
| og:locale | 현재 페이지 로케일 |
| og:site_name | "Phos AI" |
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
| 도구 간 크로스 링크 (image-edit ↔ retouching ↔ face-edit) | 페이지 권한(authority) 분산 |
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
2. `lib/seo/` 디렉토리 유틸리티 읽기 (없으면 skip — Phase 3에서 생성)
3. `next.config.ts` 읽어 headers, metadataBase, 이미지 설정 파악
4. `app/[locale]/layout.tsx` 읽어 현재 metadata 설정 파악
5. `lib/i18n/config.ts` 읽어 로케일 목록 및 Dictionary 타입 확인
6. `app/` 디렉토리 스캔하여 현재 페이지 라우트 목록 파악

---

## Phase 1: 대상 & 실행 옵션 결정

`$ARGUMENTS`를 파싱하여 대상과 실행 옵션을 결정한다.

### 대상 페이지

| 인자 | 대상 |
|------|------|
| `landing` | 랜딩 페이지 (`app/[locale]/page.tsx`) |
| `tools` | 3개 도구 페이지 (image-edit, retouching, face-edit) |
| `{page-name}` (예: `image-edit`, `pricing`) | 특정 페이지 |
| `all` 또는 인자 없음 | 모든 페이지 (기본값) |

**페이지 자동 감지**: `app/[locale]/` 디렉토리를 스캔하여 존재하는 페이지 라우트를 동적으로 파악한다.

### 실행 옵션

인자에 아래 키워드가 포함되어 있으면 해당 옵션을 활성화한다. 대상과 조합 가능 (예: `/seo tools infinite`).

| 키워드 | 옵션 | 설명 |
|--------|------|------|
| `audit` | 감사만 | Phase 2만 실행, 수정 없음 |
| `fix` | 수정만 | Phase 3만 실행 (이전 감사 결과 기반) |
| `infinite` / `loop` / `auto` | 무한 루프 모드 | 감사→수정→빌드→재감사를 Critical 0건까지 반복 |

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

### 기본 실행 흐름 (키워드 미지정 시)

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
전체 페이지를 스캔하여 12개 카테고리에서 SEO 이슈를 탐지한다.

### Step 1: 파일 수집

```bash
# 모든 page.tsx, layout.tsx 수집
Glob: app/[locale]/**/{page,layout}.tsx

# 구조화 데이터 사용처
Grep: application/ld+json (app/)

# 사이트맵, robots
Glob: app/{sitemap,robots}.ts

# next.config
Read: next.config.ts

# 이미지 사용처
Grep: <img|<Image (components/, app/)

# 미들웨어
Read: middleware.ts
```

### Step 2: 12개 카테고리 체크리스트 실행

**병렬 에이전트를 사용하여 효율적으로 감사한다:**

- **에이전트 1**: 카테고리 1-4 (메타태그, 구조화 데이터, hreflang, OG/Twitter)
- **에이전트 2**: 카테고리 5-8 (이미지, 내부 링킹, sitemap/robots, 모바일)
- **에이전트 3**: 카테고리 9-12 (보안 헤더, 접근성, 페이지 속도, 콘텐츠)

각 에이전트에게 해당 카테고리의 체크리스트와 Google 공식 문서 링크를 전달한다.

**감사 범위**: 9개 페이지 전부 (SaaS는 페이지가 적으므로 샘플링 불필요, 전체 감사)

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
- [ ] `metadataBase`가 설정
- [ ] title 템플릿이 적절 (`%s — Phos AI`)
- [ ] **"use client" 페이지에 metadata가 있는지** — wrapping `layout.tsx`가 존재하는지 확인
- [ ] Dictionary metadata 키가 실제로 페이지 수준에서 사용되는지 확인

**참고**: [title-link](https://developers.google.com/search/docs/appearance/title-link), [snippet](https://developers.google.com/search/docs/appearance/snippet)

#### 카테고리 2: 구조화 데이터 (JSON-LD)

`application/ld+json` 스크립트 태그를 모든 페이지에서 스캔:

- [ ] Organization 스키마 — 루트 레이아웃에 존재
  - 필수: `name`, `url`, `logo`
  - 권장: `sameAs` (소셜 링크), `contactPoint`
- [ ] WebApplication 스키마 — 랜딩 페이지에 존재
  - 필수: `name`, `url`, `applicationCategory`, `offers`
  - 권장: `operatingSystem`, `browserRequirements`
- [ ] SoftwareApplication 스키마 — 각 도구 페이지에 존재
  - 필수: `name`, `description`, `url`, `applicationCategory`, `offers`
  - 권장: `operatingSystem`, `author`, `inLanguage`
- [ ] BreadcrumbList 스키마 — 모든 하위 페이지에 존재
  - 필수: `itemListElement` 배열 (position, name, item)
- [ ] FAQPage 스키마 — Pricing 페이지 (dictionary에 `pricing.faq.items` 존재)
  - 필수: `mainEntity` 배열 (name, acceptedAnswer.text)
- [ ] JSON-LD 문법 오류 없음 (유효한 JSON)
- [ ] Google Rich Results Test 통과 가능한 구조
- [ ] **offers 내 "무료" 표현 없음** — 적절한 가격 표현 사용

**참고**: [구조화 데이터 개요](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data), [구조화 데이터 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

#### 카테고리 3: hreflang 정확성 (11개 로케일)

모든 페이지의 `alternates.languages` 검사:

- [ ] 11개 로케일 전부에 대한 hreflang 존재
- [ ] `x-default` hreflang 존재 (`/en/{path}`)
- [ ] self-referencing hreflang 포함
- [ ] **경로별 hreflang** — `/ko/image-edit`는 `/en/image-edit`, `/zh/image-edit` 등을 가리켜야 함 (로케일 루트 `/en`, `/zh`가 아님)
- [ ] 양방향 링크 (Next.js alternates 패턴 검증)
- [ ] 언어 코드가 ISO 639-1 준수
- [ ] hreflang URL이 절대 URL (metadataBase 포함)
- [ ] hreflang URL이 canonical URL과 일치
- [ ] 리디렉트되지 않는 URL을 가리킴 (미들웨어 리디렉트 패턴 확인)
- [ ] ar 로케일 정상 처리 (RTL이지만 hreflang 패턴은 동일)

**참고**: [hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions), [다국어 사이트](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)

#### 카테고리 4: Open Graph / Twitter Cards

모든 페이지의 메타데이터 검사:

- [ ] `og:title` 존재 (페이지별 고유)
- [ ] `og:description` 존재
- [ ] `og:url` 존재 (canonical URL과 일치)
- [ ] `og:type` 존재 ("website" 등)
- [ ] `og:image` 존재 (1200x630px 이상)
- [ ] `og:locale` 존재 (현재 로케일)
- [ ] `og:locale:alternate` 존재 (다른 로케일들)
- [ ] `og:site_name` "Phos AI"
- [ ] `twitter:card` "summary_large_image"
- [ ] `twitter:title`, `twitter:description` 존재
- [ ] 도구별 OG 이미지 존재 (각 도구 디렉토리에 `opengraph-image.tsx`)
- [ ] `twitter-image.tsx` 존재

#### 카테고리 5: 이미지 SEO

`<img>`, `<Image>` (next/image) 사용처 스캔:

- [ ] 모든 이미지에 `alt` 텍스트 존재
- [ ] alt 텍스트가 설명적 (125자 이내)
- [ ] 장식용 이미지는 `alt=""` (빈 문자열)
- [ ] `width`/`height` 또는 `fill` prop 지정 (CLS 방지)
- [ ] 히어로/LCP 이미지는 `priority` prop 사용
- [ ] 하단 이미지는 `loading="lazy"` (기본값)
- [ ] Next.js Image 컴포넌트 사용 (자동 WebP/AVIF, 리사이징)

#### 카테고리 6: 내부 링킹

링크 구조 분석:

- [ ] 모든 페이지가 홈에서 3클릭 이내 도달
- [ ] 도구 간 크로스 링크 (image-edit ↔ retouching ↔ face-edit)
- [ ] 브레드크럼 네비게이션 존재
- [ ] Navigation에 주요 페이지 링크
- [ ] Footer에 모든 페이지 링크
- [ ] 앵커 텍스트가 설명적 ("여기를 클릭" 금지)
- [ ] 고아 페이지 없음 (내부 링크가 하나도 없는 페이지)
- [ ] Next.js `<Link>` 컴포넌트 사용 (client-side 네비게이션 + 크롤러 호환)

**참고**: [링크 모범 사례](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

#### 카테고리 7: Sitemap & robots.txt

`sitemap.ts`와 `robots.ts` 검사:

- [ ] `app/sitemap.ts` 존재
- [ ] 9개 페이지 × 11개 로케일 = 99개 URL이 사이트맵에 포함
- [ ] `lastModified`가 정적 날짜 (매 빌드마다 변경 안 됨)
- [ ] priority 논리적 (landing: 1.0, tools: 0.9, pricing: 0.8, contact: 0.5, legal: 0.3)
- [ ] changeFrequency 적절 (tools: weekly, legal: yearly)
- [ ] sitemap URL = canonical URL
- [ ] 50MB / 50,000 URL 제한 준수 (99개 — 문제 없음)
- [ ] `app/robots.ts` 존재
- [ ] robots.txt에 `Sitemap:` 지시문 (`https://phos.studio/sitemap.xml`)
- [ ] CSS/JS 미차단
- [ ] 중요 페이지 미차단
- [ ] `/api/` 경로 차단
- [ ] noindex 페이지가 사이트맵에 없음

**참고**: [사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

#### 카테고리 8: 모바일 반응성

- [ ] viewport 메타태그 (Next.js 기본 제공)
- [ ] 반응형 디자인 (Tailwind 반응형 클래스)
- [ ] RTL 지원 (ar 로케일 — `dir="rtl"`)
- [ ] 터치 타겟 >= 48x48px
- [ ] 수평 오버플로 없음
- [ ] 폰트 크기 최소 16px (모바일)
- [ ] 모바일과 데스크톱 콘텐츠 동일 (모바일 우선 인덱싱)

**참고**: [모바일 우선 인덱싱](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)

#### 카테고리 9: 보안 헤더

`next.config.ts`의 `headers()` 검사:

- [ ] X-Frame-Options: SAMEORIGIN (클릭재킹 방지)
- [ ] X-Content-Type-Options: nosniff (MIME 스니핑 방지)
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy (불필요한 API 비활성화)
- [ ] Content-Security-Policy (XSS 방지 — 외부 이미지 도메인 고려: replicate.delivery, supabase, images.phos.studio)
- [ ] Strict-Transport-Security (Vercel 자동 처리 여부 확인)
- [ ] HTTPS 전용 (Vercel 자동 처리)

#### 카테고리 10: 접근성 → SEO 영향

- [ ] 시맨틱 HTML (`<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`)
- [ ] 헤딩 계층 (페이지당 단일 `<h1>`, h2→h3 순서)
- [ ] **`<html lang="{locale}">` 서버사이드 설정** — 현재 클라이언트 스크립트로만 설정됨 (Critical)
- [ ] `<html dir="rtl|ltr">` 서버사이드 설정
- [ ] ARIA 랜드마크 (필요시)
- [ ] 폼 요소에 `<label>` 연결
- [ ] 색상 대비 WCAG AA 이상

#### 카테고리 11: 페이지 속도 요인

- [ ] `next/font` 사용 (Space Grotesk + Pretendard 확인)
- [ ] `next/image` 사용
- [ ] App Router 기반 (자동 코드 분할)
- [ ] `generateStaticParams` 활용
- [ ] 불필요한 클라이언트 컴포넌트 없음
- [ ] third-party 스크립트 최소화
- [ ] preconnect/dns-prefetch 외부 도메인 (supabase, images.phos.studio, replicate.delivery)

#### 카테고리 12: 콘텐츠 품질 신호

- [ ] 씬 콘텐츠 감지 (본문 300자 미만 페이지)
- [ ] 페이지 H1에 주요 키워드 포함
- [ ] 첫 문단에 키워드 포함
- [ ] 콘텐츠가 구조화 (헤딩, 리스트, 단락)
- [ ] 로케일별 콘텐츠가 고유 (기계 번역 직역체 아님)
- [ ] 사용자 의도에 맞는 콘텐츠 (정보형 vs 도구형)
- [ ] **"무료" 키워드 미사용** (모든 로케일에서 확인)
- [ ] **"use client" 도구 페이지의 초기 HTML 콘텐츠** — Google은 초기 HTML을 읽으므로 빈 셸이면 문제

**참고**: [유용한 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

### Step 3: 감사 리포트 작성

```markdown
## SEO 감사 리포트 — Phos AI

> 스캔 일시: {날짜}
> 대상: {N}개 페이지 × 11개 로케일
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
- **카테고리**: {12개 중 해당 카테고리}
- **영향**: {검색 순위/인덱싱에 미치는 구체적 영향}
- **현재 상태**: {코드에서 발견된 현재 상태}
- **수정 방법**: {구체적 수정 코드/방법}
- **참고 문서**: {Google 공식 문서 링크}
- **자동 수정**: 가능 / 불가 (사유)

---

### Warning / Info / Good (같은 형식)
```

### 심각도 기준

| 심각도 | 기준 | 예시 |
|--------|------|------|
| **Critical** | 인덱싱/랭킹에 직접적 영향. 즉시 수정 필요 | sitemap 없음, robots.txt 없음, 페이지별 metadata 없음, html lang 미설정, hreflang 경로 버그 |
| **Warning** | SEO 경쟁력 저하. 수정하면 확실한 개선 | JSON-LD 없음, 보안 헤더 없음, 페이지별 OG 이미지 없음 |
| **Info** | 차별화 요소. 경쟁사 대비 우위 확보 | FAQPage 스키마, 콘텐츠 강화, 크로스 링킹 |
| **Good** | 현재 잘 되어 있는 부분 (유지 필요) | metadataBase, hreflang 11 로케일, OG 이미지, generateStaticParams |

---

## Phase 3: 자동 수정

### 목표
Phase 2에서 발견된 이슈를 즉시 자동으로 수정한다.

### Step 1: 자동 수정 가능 항목 분류

| 우선순위 | 수정 항목 | 방법 |
|---------|----------|------|
| P0 Critical | `<html lang>` 서버사이드 설정 | 루트 `app/layout.tsx`의 `<html>` 태그에 lang/dir 전달 (params/headers 활용) |
| P1 Critical | `app/sitemap.ts` 생성 | 9 페이지 × 11 로케일 동적 사이트맵 |
| P1 Critical | `app/robots.ts` 생성 | Allow all + Sitemap 지시문 + /api/ 차단 |
| P1 Critical | 도구 페이지별 metadata | `app/[locale]/{tool}/layout.tsx` 생성 (generateMetadata + dict 활용) |
| P1 Critical | hreflang 경로 수정 | alternates에 현재 페이지 경로 포함 |
| P2 Warning | `lib/seo/` 유틸리티 생성 | JSON-LD 빌더 (Organization, WebApplication, SoftwareApplication, BreadcrumbList, FAQPage), alternates 헬퍼 |
| P2 Warning | JSON-LD 구조화 데이터 추가 | Organization(루트), WebApplication(랜딩), SoftwareApplication(도구), BreadcrumbList(전체), FAQPage(pricing) |
| P2 Warning | 페이지별 OG 이미지 | 각 도구 디렉토리에 `opengraph-image.tsx` + `twitter-image.tsx` |
| P2 Warning | 보안 헤더 추가 | `next.config.ts` headers()에 X-Frame-Options, X-Content-Type-Options, Referrer-Policy 등 |
| P2 Warning | 비도구 페이지 metadata | pricing, contact, privacy, terms, data-deletion에 `generateMetadata` 추가 |
| P3 Info | BreadcrumbList JSON-LD | 모든 하위 페이지에 적용 |
| P3 Info | 도구 간 크로스 링킹 | 관련 도구 섹션 컴포넌트 |

### Step 2: `lib/seo/` 라이브러리 생성

```
lib/seo/
├── index.ts           # Re-exports
├── types.ts           # JsonLd 타입, BreadcrumbItem 등
├── json-ld.ts         # Organization, WebApplication, SoftwareApplication, BreadcrumbList, FAQPage 빌더
├── alternates.ts      # 경로 인식 hreflang 생성기 (11 로케일 + x-default)
```

**주요 유틸리티 역할:**

- `json-ld.ts`: 각 스키마 타입별 빌더 함수. 로케일 인식. offers에 "무료" 표현 금지.
- `alternates.ts`: `generateAlternates(path: string)` → `{ languages: { en: "/en/{path}", ko: "/ko/{path}", ..., "x-default": "/en/{path}" } }`
- `types.ts`: TypeScript 타입 정의

### Step 3: 앱 코드에 적용

1. `Read`로 최신 파일 내용 확인
2. `Edit`으로 코드 변경
3. 변경 기록

### Step 4: 빌드 검증

```bash
yarn build
```

빌드 실패 시 에러 분석 후 수정.

### Step 5: 수정 결과 리포트

```markdown
## Phase 3 수정 완료

### 적용된 수정 ({n}개)
| # | 이슈 ID | 파일 | 수정 내용 |
|---|---------|------|-----------|
| 1 | SEO-C1 | layout.tsx | html lang 서버사이드 설정 |

### 새로 생성된 파일
| 파일 | 역할 |
|------|------|
| lib/seo/json-ld.ts | JSON-LD 스키마 빌더 |

### 빌드: {성공/실패}
```

---

## Phase 4: 심층 최적화

### 목표
주요 도구 페이지의 경쟁 키워드를 분석하고, 콘텐츠 갭을 파악하여 검색 경쟁력을 최대화한다.

### Step 1: 3개 도구 페이지 선정

모든 도구 페이지를 분석 대상으로 한다 (3개뿐이므로 전수 분석):
- image-edit
- retouching
- face-edit

### Step 2: 경쟁 키워드 분석

각 도구에 대해 WebSearch로 대상 키워드 분석:

```
# 영문 키워드 (1순위)
WebSearch: "AI image editing online"
WebSearch: "AI photo retouching tool"
WebSearch: "AI face editing online"
WebSearch: "AI skin retouching"

# 한국어 키워드
WebSearch: "AI 이미지 편집"
WebSearch: "AI 피부 보정"
WebSearch: "AI 얼굴 편집"
```

상위 10개 결과 분석:
- title 태그 패턴
- meta description 패턴
- H1 태그
- 콘텐츠 구조 (FAQ, How-to, 비교표 등)
- 구조화 데이터 타입
- 페이지 콘텐츠 길이

### Step 3: 콘텐츠 갭 분석

```markdown
### 콘텐츠 갭 — {도구명}

| 요소 | 우리 | 경쟁사 비율 | 조치 |
|------|------|-----------|------|
| FAQ 섹션 | ❌ | 7/10 | 추가 필요 |
| How-to 단계 | ❌ | 6/10 | 추가 필요 |
| 기능 비교표 | ❌ | 3/10 | 선택적 |
```

### Step 4: 최적화 적용

발견된 갭을 바탕으로:
- Title/Description CTR 최적화 (경쟁사 패턴 참고)
- FAQPage/HowTo 구조화 데이터 추가 (콘텐츠가 있는 경우)
- 내부 크로스 링킹 강화

**대폭 콘텐츠 변경은 사용자 확인 후 진행한다.**

---

## Phase 5: 인덱싱 확인

### 목표
Google에 의한 사이트 인덱싱 상태를 확인한다.

### Step 1: 인덱싱 상태 확인

WebSearch로 `site:` 쿼리 실행:

```
WebSearch: site:phos.studio
WebSearch: site:phos.studio/en
WebSearch: site:phos.studio/ko
```

### Step 2: 주요 페이지별 확인

```
# 각 도구 (영문 — 1순위)
WebSearch: site:phos.studio/en/image-edit
WebSearch: site:phos.studio/en/retouching
WebSearch: site:phos.studio/en/face-edit

# 한국어
WebSearch: site:phos.studio/ko/image-edit
WebSearch: site:phos.studio/ko/retouching

# Pricing
WebSearch: site:phos.studio/en/pricing
```

### Step 3: 리포트

```markdown
## 인덱싱 모니터링 리포트

> 확인 일시: {날짜}

### 인덱싱 현황
- 총 인덱싱 페이지: 약 {N}개
- 예상 전체 페이지: 99개 (9 페이지 × 11 로케일)
- 인덱싱 비율: {N}%

### 페이지별 인덱싱 현황
| 페이지 | 인덱싱 (en) | 인덱싱 (ko) | 상태 |
|--------|-----------|-----------|------|
| Landing | ? | ? | — |
| Image Edit | ? | ? | — |
| Retouching | ? | ? | — |
| Face Edit | ? | ? | — |
| Pricing | ? | ? | — |

### 권장 조치
- {조치 항목}
```

---

## Phase 6: 학습 저장

작업 완료 후, 새로 알게 된 SEO 패턴이나 교훈이 있으면 프로젝트 메모리 `seo-lessons.md`에 저장한다.

예시:
- 특정 구조화 데이터 패턴이 Rich Results에 효과적이었음
- 경쟁사 분석에서 발견된 키워드 패턴
- Next.js "use client" 페이지의 SEO 워크어라운드
- hreflang 경로 패턴

---

## 절대 하지 않는 것

- **"무료" 키워드 사용** — Phos AI는 유료 SaaS. 모든 로케일에서 금지
- 사용자 확인 없이 페이지 콘텐츠를 대폭 변경하지 않는다
- 키워드 스터핑(과도한 키워드 삽입)을 하지 않는다 — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 숨겨진 텍스트/링크를 추가하지 않는다 — [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies) 위반
- 클로킹(사용자와 크롤러에게 다른 콘텐츠)을 하지 않는다
- 기계 번역 직역체를 SEO 콘텐츠로 사용하지 않는다
- 커밋하지 않는다 — `/commit-and-push`로 별도 진행
- 프로덕션에 직접 영향을 주는 변경(robots.txt에 Disallow 추가 등)은 반드시 사용자 확인 후
- SEO를 위해 UX를 해치지 않는다 — Google도 이를 부정적으로 평가
- 기존 도구 기능을 절대 훼손하지 않는다 — 도구 페이지는 복잡한 클라이언트 컴포넌트
- `pnpm` 사용 금지 — 이 프로젝트는 `yarn` 사용
