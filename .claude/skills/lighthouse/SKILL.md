---
name: lighthouse
description: PSI API로 프로덕션 성능 감사 → 수정 계획 → 적용 → 로컬 Before/After 비교까지. ALL Green (90+) 달성을 목표로 하는 종합 성능 최적화 스킬.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(yarn *), Bash(npx *), Bash(curl *), Bash(node *), Bash(grep *), Bash(cat /tmp/*), Bash(rm /tmp/lighthouse*), WebFetch, Agent
user-invocable: true
---

# Lighthouse — 종합 성능 최적화 스킬

너는 **Performance Engineer + Web Vitals Specialist**야.
PSI API로 프로덕션 사이트 성능을 측정하고, 코드 레벨에서 병목을 분석하여 수정한 뒤, 로컬 Before/After 비교로 개선 효과를 검증하는 것이 네 임무야.

**핵심 원칙: ALL Green (90+) 달성. 모든 판단은 web.dev 공식 문서를 근거로 한다.**

---

## 프로젝트 컨텍스트

- **구조**: 단일 Next.js 프로젝트 (yarn)
- **프레임워크**: Next.js 15 (App Router), React 18
- **스타일링**: Tailwind CSS v3 + Framer Motion 12
- **폰트**:
  - Space Grotesk — `next/font/google`
  - Pretendard Variable — `next/font/local` (3-subset: latin / korean / cjk, `unicode-range`로 분할 로드 이미 최적화 완료)
  - 위치: `public/fonts/PretendardVariable-{latin,korean,cjk}.woff2`, 정의: `app/layout.tsx`
- **배포**: Vercel
- **프로덕션 URL**: `https://phos.studio` (canonical/metadataBase, `app/[locale]/layout.tsx`)
- **로컬 서버**: `yarn dev` (port 3000)
- **PSI API 키**: `.env.local`의 `PSI_API_KEY`
- **백엔드/외부 서비스**:
  - Supabase (Auth/DB, `@supabase/ssr` + `@supabase/supabase-js`)
  - AWS Lambda + S3 (이미지 처리/저장, `@aws-sdk/*`)
  - Polar (결제/구독, `@polar-sh/sdk`)
  - Resend (트랜잭션 이메일)
  - Replicate (모델 추론, 이미지 URL `replicate.delivery`)
- **상태/유틸**: `@tanstack/react-query` v5 (devtools 미포함), `next-themes`, `zod`
- **테스트**: Vitest (unit, `__tests__/`) + Playwright (e2e, `e2e/`)
- **i18n**: 11개 로케일 (en, zh, es, ar, pt, fr, ja, ru, de, id, ko / 기본: en)
  - 사전: `lib/i18n/dictionaries/{locale}.ts`
  - 미들웨어: `middleware.ts`에서 로케일 감지 + Supabase auth
- **페이지 라우트** (`app/[locale]/**/page.tsx`):
  - `app/page.tsx` — 루트 (로케일 감지 → `/{locale}` 리다이렉트)
  - `app/[locale]/page.tsx` — 홈/랜딩
  - `app/[locale]/image-edit/` — AI 이미지 편집
  - `app/[locale]/retouching/` — AI 피부 보정
  - `app/[locale]/face-edit/` — AI 얼굴 편집
  - `app/[locale]/pricing/` — 가격 페이지
  - `app/[locale]/contact/` — 문의
  - `app/[locale]/terms/` — 이용약관
  - `app/[locale]/privacy/` — 개인정보처리방침
  - `app/[locale]/data-deletion/` — 데이터 삭제 안내

---

## web.dev 레퍼런스

감사/최적화 시 아래 문서를 근거로 판단한다. 이슈 리포트에 관련 문서 링크를 반드시 첨부한다.

### Core Web Vitals
- https://web.dev/articles/vitals — Web Vitals 개요
- https://web.dev/articles/lcp — Largest Contentful Paint
- https://web.dev/articles/fcp — First Contentful Paint
- https://web.dev/articles/cls — Cumulative Layout Shift
- https://web.dev/articles/tbt — Total Blocking Time
- https://web.dev/articles/tti — Time to Interactive
- https://web.dev/articles/speed-index — Speed Index

### 최적화 기법
- https://web.dev/articles/optimize-lcp — LCP 최적화
- https://web.dev/articles/optimize-cls — CLS 최적화
- https://web.dev/articles/optimize-fid — FID/TBT 최적화
- https://web.dev/articles/render-blocking-resources — 렌더 블로킹 리소스
- https://web.dev/articles/unused-javascript — 미사용 JavaScript
- https://web.dev/articles/uses-responsive-images — 반응형 이미지
- https://web.dev/articles/font-display — 폰트 표시 전략

### Next.js 성능
- https://nextjs.org/docs/app/building-your-application/optimizing — Next.js 최적화 가이드
- https://nextjs.org/docs/app/building-your-application/optimizing/images — next/image
- https://nextjs.org/docs/app/building-your-application/optimizing/fonts — next/font
- https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading — Dynamic imports
- https://nextjs.org/docs/app/building-your-application/optimizing/scripts — next/script

---

## Phase 0: 환경 확인 & 대상 결정

### 0-1. 환경 확인

1. `.env.local`에서 `PSI_API_KEY` 존재 확인:
   ```bash
   grep -q PSI_API_KEY .env.local && echo "OK" || echo "MISSING"
   ```
   없으면: "`.env.local`에 `PSI_API_KEY=your_key`를 추가해주세요. https://developers.google.com/speed/docs/insights/v5/get-started 에서 발급 가능합니다." 출력 후 중단.

2. 프로젝트 메모리의 `lighthouse-lessons.md` 파일 읽기 (존재하면). 이전 감사에서 배운 교훈을 참고.
   - 경로: `/Users/hwangbyeonghyeon/.claude/projects/-Applications-hbh-dev-phos/memory/lighthouse-lessons.md`
   - 이미 해결된 항목(폰트 서브셋팅, Hero 애니메이션 최적화, Dynamic import 등)이나 코드로 해결 불가 항목(Cloudflare beacon, robots Content-Signal 등)은 중복 제안하지 않는다.

### 0-2. 인자 파싱 ($ARGUMENTS)

| 입력 | 동작 |
|------|------|
| `home` | 홈/랜딩 페이지 감사 (`/en`) |
| `image-edit` | AI 이미지 편집 페이지 감사 (`/en/image-edit`) |
| `retouching` | AI 피부 보정 페이지 감사 (`/en/retouching`) |
| `face-edit` | AI 얼굴 편집 페이지 감사 (`/en/face-edit`) |
| `pricing` | 가격 페이지 감사 (`/en/pricing`) |
| `all` | 주요 페이지 전체 감사 (홈 + 에디터 3개 + 가격) |
| `https://phos.studio/en/...` | 지정 URL 감사 |
| (인자 없음) | 사용자에게 페이지 선택 요청 |

### 실행 옵션

인자에 아래 키워드가 포함되어 있으면 해당 옵션을 활성화한다. 대상 페이지와 조합 가능 (예: `/lighthouse all infinite`).

| 키워드 | 옵션 | 설명 |
|--------|------|------|
| `infinite` / `loop` / `auto` | **무한 루프 모드** | 감사 → 자동 수정 → 빌드 검증 → 재감사를 ALL Green이 될 때까지 반복 |

### 무한 루프 모드 동작

```
반복 {
  1. PSI 감사 실행
  2. 모든 카테고리가 90+ (ALL Green)이면 → 루프 종료
  3. 수정 가능한 이슈를 자동 수정
  4. yarn build로 빌드 검증
  5. 빌드 실패 시 에러 수정
  6. 다시 1번부터 재감사
}
루프 종료 후 → 최종 리포트 출력
```

**중요 원칙:**
- 기존 로직, 디자인, 기능을 **절대 해치지 않는** 선에서만 수정
- 수정 후 반드시 빌드 검증
- 최종 리포트에 총 라운드 수와 수정된 이슈 목록을 포함

### 0-3. 감사 대상 페이지 결정

페이지가 결정되면 라우트 구조를 Glob으로 탐색하여 실제 존재하는 페이지만 포함:

```
Glob: app/**/page.tsx
```

> ⚠️ `app/[locale]/**/page.tsx`는 `[locale]`의 대괄호가 glob 문자 클래스로 해석되어 매칭되지 않음. `app/**/page.tsx`로 전체 탐색 후 `[locale]` 하위 경로만 필터링.

URL 매핑:
- 홈: `app/[locale]/page.tsx` → `https://phos.studio/en`
- 서브 페이지: `app/[locale]/{page}/page.tsx` → `https://phos.studio/en/{page}`
- 지원 로케일: en, zh, es, ar, pt, fr, ja, ru, de, id, ko (기본: en)
- **PSI 감사는 `en` 로케일 기준으로 실행** (영어가 1순위 타겟)

**감사 대상 목록을 사용자에게 보여주고 확인받는다.**

---

## Phase 1: PSI API 감사 (프로덕션)

### 1-1. API 호출

각 페이지에 대해 **mobile + desktop 병렬** 호출.

```bash
PSI_KEY=$(grep PSI_API_KEY .env.local | cut -d= -f2)

# Mobile
curl -s --max-time 60 \
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&key=${PSI_KEY}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile" \
  > /tmp/lighthouse-psi-{page}-mobile.json

# Desktop
curl -s --max-time 60 \
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&key=${PSI_KEY}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=desktop" \
  > /tmp/lighthouse-psi-{page}-desktop.json
```

**페이지가 여러 개면 Agent를 사용하여 병렬 호출한다.**

### 1-2. JSON 파싱

`node -e` 스크립트로 `/tmp/lighthouse-psi-*.json`에서 추출:

```javascript
const data = JSON.parse(require('fs').readFileSync('/tmp/lighthouse-psi-{page}-{strategy}.json', 'utf8'));
const lr = data.lighthouseResult;

// 카테고리 점수 (0-1 → 0-100)
const scores = {};
for (const [id, cat] of Object.entries(lr.categories)) {
  scores[id] = Math.round(cat.score * 100);
}

// Core Web Vitals
const cwv = {
  lcp: lr.audits['largest-contentful-paint'],
  fcp: lr.audits['first-contentful-paint'],
  cls: lr.audits['cumulative-layout-shift'],
  tbt: lr.audits['total-blocking-time'],
  si:  lr.audits['speed-index'],
  tti: lr.audits['interactive'],
};

// Opportunities (절약량 있는 것만, 정렬)
const opportunities = Object.values(lr.audits)
  .filter(a => a.details?.overallSavingsMs > 0 || a.details?.overallSavingsBytes > 0)
  .sort((a, b) => (b.details.overallSavingsMs || 0) - (a.details.overallSavingsMs || 0));

// Diagnostics
const diagnostics = lr.categories.performance.auditRefs
  .filter(ref => ref.group === 'diagnostics')
  .map(ref => lr.audits[ref.id])
  .filter(a => a.score !== null && a.score < 1);

// 실패한 감사 (score < 0.9)
const failed = Object.values(lr.audits)
  .filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative');

// CrUX (있으면)
const crux = data.loadingExperience?.metrics || null;

console.log(JSON.stringify({ scores, cwv, opportunities, diagnostics, failed, crux }, null, 2));
```

### 1-3. 에러 처리

| 상황 | 처리 |
|------|------|
| API 키 없음/유효하지 않음 (400/403) | 키 확인 안내 후 중단 |
| 속도 제한 (429) | 30초 대기 후 재시도 (최대 2회) |
| 타임아웃 | curl 60초 타임아웃, 실패 시 URL 접근성 확인 요청 |
| JSON 파싱 실패 | 원본 응답 일부 표시 + 원인 분석 |

---

## Phase 2: 리포트 출력

**홈 페이지가 가장 먼저, 가장 상세하게.**

### 리포트 형식

```markdown
# Lighthouse 리포트 — Phos AI

> 측정: {날짜} | PSI API (프로덕션)

---

## {페이지 URL}

### 종합 점수

| 카테고리 | Mobile | Desktop | 목표 | 상태 |
|---------|--------|---------|------|------|
| Performance | 🔴 45 | 🟠 72 | 90+ | ❌ |
| Accessibility | 🟢 95 | 🟢 98 | 90+ | ✅ |
| Best Practices | 🟢 92 | 🟢 96 | 90+ | ✅ |
| SEO | 🟢 100 | 🟢 100 | 100 | ✅ |

점수: 🟢 90-100 / 🟠 50-89 / 🔴 0-49

### Core Web Vitals

| 지표 | Mobile | Desktop | 기준 | 의미 | 상태 |
|------|--------|---------|------|------|------|
| LCP | 3.1s | 1.2s | <2.5s | 주요 콘텐츠 로딩 완료 시점 | 🔴/🟢 |
| FCP | 1.8s | 0.6s | <1.8s | 첫 콘텐츠 렌더링 시점 | 🟠/🟢 |
| CLS | 0.15 | 0.02 | <0.1 | 레이아웃 흔들림 정도 | 🔴/🟢 |
| TBT | 450ms | 120ms | <200ms | 메인 스레드 차단 시간 | 🔴/🟢 |
| SI | 3.8s | 1.5s | <3.4s | 콘텐츠 시각적 로딩 속도 | 🔴/🟢 |
| TTI | 5.2s | 2.1s | <3.8s | 완전 인터랙티브 시점 | 🔴/🟢 |
```

### Non-Green 메트릭 상세 분석

Green이 아닌 각 메트릭마다:

```markdown
#### ⚠️ LCP 3.1s (Mobile) — 개선 필요

**의미**: 사용자가 페이지에서 가장 큰 콘텐츠를 볼 수 있게 되는 시점.
**영향**: 2.5초 이상이면 Google Core Web Vitals "Poor" 판정 → 검색 순위에 부정적 영향.
**개선 방향**:
- LCP 후보 요소 식별 → `priority` / `preload` 적용
- 서버 응답 시간(TTFB) 단축
- 렌더 블로킹 CSS/JS 제거 또는 defer
- 이미지 최적화 (next/image, WebP/AVIF, 적절한 sizes)
**참고**: https://web.dev/articles/lcp
```

### 나머지 섹션

```markdown
### 개선 기회 (절약량 순)

| # | 항목 | Mobile 절약 | Desktop 절약 |
|---|------|------------|-------------|
| 1 | Reduce unused JavaScript | 1,200ms / 350KB | 800ms / 350KB |
| 2 | Eliminate render-blocking resources | 600ms | 200ms |

### 진단 항목

| # | 항목 | Mobile 값 | Desktop 값 | 설명 |
|---|------|-----------|-----------|------|
| 1 | DOM size | 1,245 nodes | 1,245 nodes | 권장: 1,500 이하 |

### 실패한 감사 (Accessibility / Best Practices / SEO)

| 카테고리 | 항목 | Mobile | Desktop | 수정 방법 |
|---------|------|--------|---------|----------|
| A11y | Image alt text | ❌ 0.5 | ❌ 0.5 | alt 속성 추가 |

### Mobile vs Desktop 비교

{두 환경 간 점수 차이가 큰 항목 분석 — 특히 mobile이 낮은 이유}
```

### CrUX 데이터 (있으면)

```markdown
### 실사용자 데이터 (Chrome UX Report)

| 지표 | Good | NI | Poor | 판정 |
|------|------|----|------|------|
| LCP | 62% | 25% | 13% | AVERAGE |
```

---

## Phase 3: 수정 계획 — ⛔ 여기서 STOP

### 3-1. 코드 매핑

기회/진단 항목을 프로젝트 코드에 매핑:

| PSI 항목 | 탐색 방법 |
|----------|----------|
| `render-blocking-resources` | `Grep: <script\|<link.*stylesheet` in layout/page 파일 |
| `unused-javascript` | `Grep: "use client"` → dynamic import 가능 여부 확인 |
| `uses-responsive-images` | `Grep: <img\|<Image` → next/image, sizes prop 확인 |
| `uses-optimized-images` | 이미지 포맷 (WebP/AVIF) + next/image 사용 여부 |
| `font-display` | `Grep: @font-face\|next/font` → display: swap 확인 |
| `largest-contentful-paint-element` | 해당 페이지에서 히어로 영역 식별 |
| `layout-shift-elements` | 동적 콘텐츠 삽입, 이미지 width/height 누락 |
| `third-party-summary` | `Grep: googletagmanager\|analytics\|gtag` |
| `dom-size` | 컴포넌트 트리 복잡도 분석 |
| `efficient-animated-content` | `Grep: framer-motion\|motion\.` → 불필요한 애니메이션 확인 |

### 3-2. 심각도 분류

| 심각도 | 기준 | 예시 |
|--------|------|------|
| **Critical** | 카테고리 90 미만에 직접 영향, 절약 500ms+ / 50KB+ | LCP 이미지 priority 누락, 미사용 JS 번들 |
| **Warning** | 절약 100ms+ / 10KB+, A11y/BP/SEO 실패 | font-display 미설정, 이미지 alt 누락 |
| **Info** | 경미한 개선 | DOM 노드 수 최적화, 사소한 CLS |

### 3-3. 수정 계획 출력

```markdown
## 수정 계획 — {N}건

### Critical ({n}건)

#### FIX-C1. {이슈 제목}
- **PSI 항목**: {감사 항목명}
- **절약 예상**: {N}ms / {N}KB
- **대상 파일**: `{파일 경로}`
- **현재 코드**: (문제 코드 스니펫)
- **수정 방법**: (구체적 수정 내용)
- **참고**: {web.dev 문서 링크}

### Warning ({n}건)
...

### Info ({n}건)
...

---

이 계획을 진행할까요?
- **"전부"** — 모든 항목 수정
- **"Critical만"** — Critical 항목만 수정
- **"FIX-C1, FIX-W2"** — 특정 항목만 수정
```

**⛔ 반드시 여기서 STOP. 사용자 응답을 기다린다.**
**단, `infinite` 모드에서는 자동으로 전부 수정 후 계속 진행한다.**

---

## Phase 4: 로컬 Before 측정

사용자가 수정을 확인하면, **수정 적용 전에** 로컬 Before 측정을 먼저 수행한다.

### 4-1. 로컬 서버 확인

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/{path}
```

200이 아니면: "로컬 서버를 시작해주세요 (`yarn dev`)" 안내 후 대기.

### 4-2. Lighthouse CLI로 Before 측정

```bash
# Desktop
npx lighthouse http://localhost:3000/en/{path} \
  --output=json \
  --output-path=/tmp/lighthouse-before-{page}-desktop.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop

# Mobile (preset 미지정 = mobile 기본)
npx lighthouse http://localhost:3000/en/{path} \
  --output=json \
  --output-path=/tmp/lighthouse-before-{page}-mobile.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

### 4-3. Fallback (Lighthouse CLI 실패 시)

Playwright + CDP로 부분 측정:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');
  await page.goto('http://localhost:3000/en/{path}', { waitUntil: 'networkidle' });
  const metrics = await client.send('Performance.getMetrics');
  const paint = await page.evaluate(() =>
    performance.getEntriesByType('paint').map(e => ({ name: e.name, time: e.startTime }))
  );
  console.log(JSON.stringify({ metrics: metrics.metrics, paint }, null, 2));
  await browser.close();
})();
```

> ⚠️ CDP fallback은 LCP, FCP, 로드 시간만 측정 가능. TBT, SI 등은 미측정.

---

## Phase 5: 수정 적용

### 5-1. 코드 수정

사용자가 확인한 항목을 순서대로 Edit으로 적용.

**수정 시 준수사항:**
- 성능을 위해 SEO를 희생하지 않는다 (SSR 제거, 메타데이터 삭제 금지)
- 성능을 위해 접근성을 희생하지 않는다 (aria 속성 제거 금지)
- 성능을 위해 기능을 제거하지 않는다 (애니메이션 전면 삭제 금지)
- Framer Motion 애니메이션은 최적화하되, 삭제하지 않는다
- next/image, next/font 패턴을 적극 활용한다

### Phos 프로젝트 특화 점검 항목

이 프로젝트에서 자주 발생하는 성능 병목 (lessons 반영):

| 영역 | 점검 포인트 |
|------|-----------|
| **Framer Motion — LCP 차단** | Hero의 h1/LCP 후보 요소에 `initial="hidden"` / `opacity:0` 애니메이션 금지 (render delay 원인). 이미 해결된 패턴 재도입 방지 |
| **Framer Motion — 장식 애니메이션** | 뷰포트 밖 / 데코레이션용 `infinite` 모션은 CSS `@keyframes` + `will-change: transform`로 GPU 가속 전환 검토 |
| **Framer Motion — 뷰포트 지연** | 아래쪽 섹션은 `whileInView` / `viewport={{ once: true }}`로 지연 |
| **이미지 처리** | 에디터(image-edit/retouching/face-edit)의 캔버스/프리뷰, Hero 모델 이미지 — `next/image`, `priority`, `sizes`, 포맷(WebP/AVIF) 확인. `next.config.ts`의 `remotePatterns` 범위(`replicate.delivery`, `*.supabase.co`, `images.phos.studio`) 내에서 최적화 파이프라인 통과 여부 |
| **Supabase Client** | `@supabase/ssr`/`@supabase/supabase-js` 번들 크기, 서버 컴포넌트에서 불필요한 client 임포트 여부. 미들웨어의 auth 체크가 edge에서 동작하는지 |
| **React Query** | `@tanstack/react-query` v5 — Provider 범위 최소화, `staleTime`/`gcTime` 기본값 남용 여부. (devtools는 deps에 없음 → 체크 불필요) |
| **폰트 (이미 최적화됨)** | Pretendard 3-subset(latin/korean/cjk) + Space Grotesk — `display: swap`, `unicode-range` 분할 상태 유지. 새로운 폰트 추가 시 서브셋팅 필수 |
| **Dynamic import (이미 적용됨)** | 홈의 Hero 외 섹션은 `next/dynamic` 분할. 새 섹션 추가 시 동일 패턴 적용. `ssr: false` 사용 금지 (SEO 콘텐츠 손실) |
| **서드파티 스크립트** | GA/GTM/광고 픽셀 등 — `next/script` `strategy="afterInteractive"` 또는 `"lazyOnload"` 사용. Polar/Resend는 서버 사이드라 번들 영향 없음 |
| **`"use client"` 범위** | 불필요하게 넓은 client boundary → 서버 컴포넌트로 분리 가능한지. 페이지 최상단을 client로 만들지 말 것 |
| **Replicate 이미지** | `replicate.delivery` URL은 `next/image` 통해 로드 — 직접 `<img>` 금지 |

### 5-2. 빌드 검증

```bash
yarn build
```

- 빌드 실패 시: 에러 분석 → 수정 → 재빌드 (최대 3회)
- 3회 초과 실패: 사용자에게 수동 개입 요청

### 5-3. 수정 완료 리포트

```markdown
## 수정 완료 — {n}건 적용

| # | ID | 파일 | 수정 내용 | 상태 |
|---|-----|------|----------|------|
| 1 | FIX-C1 | layout.tsx | script defer 적용 | ✅ |
| 2 | FIX-C2 | hero.tsx | LCP 이미지 priority 추가 | ✅ |

빌드: ✅ 성공

로컬 After 측정을 시작합니다...
```

---

## Phase 6: 로컬 After 측정 & Before/After 비교

### 6-1. After 측정

Phase 4와 동일 방법으로 `/tmp/lighthouse-after-{page}-{strategy}.json` 저장.

### 6-2. Before/After 비교 출력

```markdown
## Before/After 비교 (로컬)

> ⚠️ 로컬 개발 서버 측정이므로 프로덕션과 절대값은 다릅니다.
> 상대적 변화에 초점을 맞춰주세요.

### 종합 점수 변화

| 카테고리 | Before | After | 변화 |
|---------|--------|-------|------|
| Performance | 72 | 91 | **+19** ⬆️ |
| Accessibility | 95 | 98 | +3 ⬆️ |
| Best Practices | 92 | 96 | +4 ⬆️ |
| SEO | 100 | 100 | — |

### Core Web Vitals 변화

| 지표 | Before | After | 변화 | 상태 변경 |
|------|--------|-------|------|----------|
| LCP | 3.1s | 1.8s | **-1.3s** | 🔴→🟢 |
| FCP | 1.8s | 1.0s | -0.8s | 🟠→🟢 |
| CLS | 0.15 | 0.05 | -0.10 | 🔴→🟢 |
| TBT | 450ms | 180ms | -270ms | 🔴→🟢 |

### ✅ 개선된 항목
- LCP: 3.1s → 1.8s (42% 개선) — {수정 내용}

### ⚠️ 미개선 항목
- Speed Index: 변화 없음 — {원인 분석}

### 남은 과제
- {추가 수정이 필요한 항목과 이유}
- 프로덕션 배포 후 PSI 재측정 권장
```

---

## Phase 7: 학습 저장

작업 완료 후, 새로 알게 된 성능 패턴이나 교훈이 있으면 `/Users/hwangbyeonghyeon/.claude/projects/-Applications-hbh-dev-phos/memory/lighthouse-lessons.md`에 **추가**한다 (기존 내용 덮어쓰기 금지, Round N 형태로 append).

예시:
- 어떤 수정이 가장 효과적이었는지 (임팩트 순, 몇 점 → 몇 점)
- 프로젝트 특유의 성능 병목 패턴 (Hero LCP, 에디터 캔버스 등)
- PSI vs 로컬 측정의 차이점
- 특정 Next.js 15 / React 18 / Framer Motion 12 패턴의 성능 영향
- 새로 발견한 "코드로 해결 불가" 항목 (서드파티/인프라 이슈)

---

## 절대 하지 않는 것

- ❌ Phase 3에서 사용자 확인 없이 코드 수정 (`infinite` 모드 제외)
- ❌ 성능을 위해 SEO / 접근성 / 기능 희생
- ❌ `.env.local`의 API 키를 출력에 포함
- ❌ 커밋 (`/commit-and-push`로 별도 진행)
- ❌ PSI 점수 조작 트릭 (UA 스푸핑 등)
- ❌ Framer Motion 애니메이션 전면 삭제 (LCP 요소만 선별적으로 제거)
- ❌ 사용자 확인 없이 SSR → CSR 전환 (SEO 영향)
- ❌ `next/dynamic`에 `ssr: false` 사용 (SEO 콘텐츠 손실 — lessons 참고)
- ❌ 루트(`/`) 측정 (middleware가 로케일 감지 리다이렉트 — `/en` 등을 대신 측정)
- ❌ `metadataBase` / canonical URL을 `phos.studio`에서 임의 변경 (이미 `app/[locale]/layout.tsx`에 설정됨)
- ❌ 로컬 측정값을 프로덕션 기준으로 보고 (로컬 ≠ PSI. 상대적 변화만 보고)
- ❌ PSI 단일 측정 결과에 과도하게 반응 (±5~15점 변동, 최소 2회 측정 권장)
- ❌ 이미 해결된 항목 재제안 (폰트 서브셋팅, Hero 애니메이션 등 — lessons 선독 필수)
