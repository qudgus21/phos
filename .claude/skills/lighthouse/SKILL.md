---
name: lighthouse
description: PSI API로 프로덕션 성능 감사 → 수정 계획 → 적용 → 로컬 Before/After 비교까지. ALL Green (90+) 달성을 목표로 하는 종합 성능 최적화 스킬.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(yarn *), Bash(npx *), Bash(curl *), Bash(node *), Bash(cat /tmp/*), Bash(rm /tmp/lighthouse*), WebFetch, Agent
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
- **스타일링**: Tailwind CSS v3 + Framer Motion
- **배포**: Vercel
- **프로덕션 URL**: `https://phos.studio`
- **로컬 서버**: `yarn dev` (port 3000)
- **E2E**: Playwright (Chromium)
- **PSI API 키**: `.env.local`의 `PSI_API_KEY`
- **백엔드**: Supabase (Auth/DB), AWS Lambda (이미지 최적화)
- **페이지 라우트**:
  - `app/page.tsx` — 홈/랜딩
  - `app/image-edit/` — AI 이미지 편집
  - `app/retouching/` — AI 피부 보정
  - `app/face-edit/` — AI 얼굴 편집
  - `app/pricing/` — 가격 페이지

---

## Phase 0: 환경 확인 & 인자 파싱

### 0-1. 환경 확인

1. `.env.local`에서 `PSI_API_KEY` 존재 확인:
   ```bash
   grep -q PSI_API_KEY .env.local && echo "OK" || echo "MISSING"
   ```
   없으면: "`.env.local`에 `PSI_API_KEY=your_key`를 추가해주세요. https://developers.google.com/speed/docs/insights/v5/get-started 에서 발급 가능합니다." 출력 후 중단.

2. 프로젝트 메모리의 `lighthouse-lessons.md` 파일 읽기 (존재하면). 이전 감사에서 배운 교훈을 참고.

### 0-2. 인자 파싱 ($ARGUMENTS)

| 입력 | 동작 |
|------|------|
| `home` | 홈/랜딩 페이지 감사 |
| `image-edit` | AI 이미지 편집 페이지 감사 |
| `retouching` | AI 피부 보정 페이지 감사 |
| `face-edit` | AI 얼굴 편집 페이지 감사 |
| `pricing` | 가격 페이지 감사 |
| `all` | 모든 페이지 순차 감사 |
| `https://phos.studio/image-edit` | 지정 URL 감사 |
| (인자 없음) | 사용자에게 페이지 선택 요청 |

**홈 페이지는 항상 가장 먼저, 가장 중요하게 검사한다.**

- 홈 URL: `https://phos.studio`
- 페이지 URL 패턴: `https://phos.studio/{page}` (예: `https://phos.studio/image-edit`, `https://phos.studio/pricing`)

### 0-3. 감사 대상 페이지 결정

페이지가 결정되면 `app/` 라우트 구조를 Glob으로 탐색:

```
Glob: app/**/page.tsx
```

- 홈: `app/page.tsx` → `https://phos.studio`
- 에디터 페이지: `app/{page}/page.tsx` → `https://phos.studio/{page}`

**감사 대상 목록을 사용자에게 보여주고 확인받는다:**

```
감사 대상 페이지:
1. [홈] https://phos.studio
2. https://phos.studio/image-edit
3. https://phos.studio/retouching
4. https://phos.studio/face-edit
5. https://phos.studio/pricing

이대로 진행할까요?
```

---

## Phase 1: PSI API 감사 (프로덕션)

### 1-1. API 호출

각 페이지에 대해 **mobile + desktop 병렬** 호출.

```bash
# PSI_API_KEY는 .env.local에서 읽어온다
PSI_KEY=$(grep PSI_API_KEY .env.local | cut -d= -f2)

# Mobile
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&key=${PSI_KEY}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile" \
  > /tmp/lighthouse-psi-{page}-mobile.json

# Desktop
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={URL}&key=${PSI_KEY}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=desktop" \
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

**앱 홈이 가장 먼저, 가장 상세하게.**

### 리포트 형식

```markdown
# Lighthouse 리포트 — {앱명}

> 측정: {날짜} | PSI API (프로덕션)

---

## 📊 {페이지 URL}

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

### Green이 아닌 메트릭에 대해 추가 분석

각 non-green 메트릭마다:

```markdown
#### ⚠️ LCP 3.1s (Mobile) — 개선 필요

**의미**: 사용자가 페이지에서 가장 큰 콘텐츠(히어로 이미지, 큰 텍스트 블록 등)를 볼 수 있게 되는 시점.
**영향**: 2.5초 이상이면 Google Core Web Vitals "Poor" 판정 → 검색 순위에 부정적 영향.
**개선 방향**:
- LCP 후보 요소 식별 → `priority` / `preload` 적용
- 서버 응답 시간(TTFB) 단축
- 렌더 블로킹 CSS/JS 제거 또는 defer
- 이미지 최적화 (next/image, WebP/AVIF, 적절한 sizes)
**참고**: https://web.dev/articles/lcp
```

TBT, SI, FCP, CLS, TTI에 대해서도 동일 패턴으로.

### 나머지 섹션

```markdown
### 개선 기회 (절약량 순)

| # | 항목 | Mobile 절약 | Desktop 절약 |
|---|------|------------|-------------|
| 1 | Reduce unused JavaScript | 1,200ms / 350KB | 800ms / 350KB |
| 2 | Eliminate render-blocking resources | 600ms | 200ms |
| 3 | Properly size images | — / 120KB | — / 120KB |

### 진단 항목

| # | 항목 | Mobile 값 | Desktop 값 | 설명 |
|---|------|-----------|-----------|------|
| 1 | DOM size | 1,245 nodes | 1,245 nodes | 권장: 1,500 이하 |
| 2 | Third-party code | 1.2s blocking | 0.8s blocking | Google Ads, Analytics |

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
| FCP | 78% | 15% | 7% | GOOD |
```

---

## Phase 3: 수정 계획 — ⛔ 여기서 STOP

### 3-1. 코드 매핑

기회/진단 항목을 프로젝트 코드에 매핑:

| PSI 항목 | 탐색 방법 |
|----------|----------|
| `render-blocking-resources` | `Grep: <script|<link.*stylesheet` in layout/page 파일 |
| `unused-javascript` | `Grep: "use client"` → dynamic import 가능 여부 확인 |
| `uses-responsive-images` | `Grep: <img|<Image` → next/image, sizes prop 확인 |
| `uses-optimized-images` | 이미지 포맷 (WebP/AVIF) + next/image 사용 여부 |
| `font-display` | `Grep: @font-face|next/font` |
| `largest-contentful-paint-element` | 해당 페이지에서 히어로 영역 식별 |
| `layout-shift-elements` | 동적 콘텐츠 삽입, 이미지 width/height 누락 |
| `third-party-summary` | `Grep: googletagmanager|googlesyndication|analytics` |
| `dom-size` | 컴포넌트 트리 복잡도 분석 |
| `efficient-animated-content` | `Grep: framer-motion|motion\.` |

### 3-2. 심각도 분류

- **Critical**: 카테고리 90 미만에 직접 영향, 절약 500ms+ / 50KB+
- **Warning**: 절약 100ms+ / 10KB+, A11y/BP/SEO 실패
- **Info**: 경미한 개선

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

**Green이 아닌 메트릭을 위한 추가 제안:**

{Phase 2에서 non-green으로 표시된 메트릭에 대해, 위 기회 항목 외에 추가로 할 수 있는 것들을 제안}

예:
- LCP가 여전히 느리다면: `<link rel="preload">` 추가, TTFB 개선을 위한 ISR/SSG 전환 고려
- TBT가 높다면: 무거운 라이브러리의 dynamic import, Web Worker 분리
- CLS가 높다면: 이미지/광고 슬롯에 고정 크기 지정, font-display: swap

---

이 계획을 진행할까요?
- **"전부"** — 모든 항목 수정
- **"Critical만"** — Critical 항목만 수정
- **"FIX-C1, FIX-W2"** — 특정 항목만 수정
```

**⛔ 반드시 여기서 STOP. 사용자 응답을 기다린다.**

---

## Phase 4: 로컬 Before 측정

사용자가 수정을 확인하면, **수정 적용 전에** 로컬 Before 측정을 먼저 수행한다.

### 4-1. 로컬 서버 확인

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/{app}
```

- 200이 아니면: "로컬 서버를 시작해주세요 (`yarn dev`)" 안내.

### 4-2. Lighthouse CLI로 Before 측정

```bash
npx lighthouse http://localhost:3000/{path} \
  --output=json \
  --output-path=/tmp/lighthouse-before-{page}.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop

# Mobile도
npx lighthouse http://localhost:3000/{path} \
  --output=json \
  --output-path=/tmp/lighthouse-before-{page}-mobile.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo
```

### 4-3. Fallback (lighthouse CLI 실패 시)

Playwright + Chrome DevTools Protocol로 부분 측정:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');

  await page.goto('http://localhost:3000/{path}', { waitUntil: 'networkidle' });

  const metrics = await client.send('Performance.getMetrics');
  const paint = await page.evaluate(() => {
    return performance.getEntriesByType('paint').map(e => ({ name: e.name, time: e.startTime }));
  });

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

Phase 4와 동일 방법으로 `/tmp/lighthouse-after-{page}.json` 저장.

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
- LCP: 3.1s → 1.8s (42% 개선) — 히어로 이미지 priority 적용
- TBT: 450ms → 180ms (60% 개선) — 서드파티 스크립트 defer

### ⚠️ 미개선 항목
- Speed Index: 변화 없음 — 서드파티 스크립트의 영향, 코드 수정으로는 한계

### 남은 과제
- {추가 수정이 필요한 항목과 이유}
- {프로덕션 배포 후 PSI 재측정 권장}
```

---

## Phase 7: 학습 저장

프로젝트 메모리의 `lighthouse-lessons.md`에 기록:

- 어떤 수정이 가장 효과적이었는지
- 프로젝트 특유의 성능 병목 패턴
- PSI vs 로컬 측정의 차이점
- 특정 Next.js / React 패턴의 성능 영향

---

## 절대 하지 않는 것

- ❌ Phase 3에서 사용자 확인 없이 코드 수정
- ❌ 성능을 위해 SEO / 접근성 / 기능 희생
- ❌ `.env.local`의 API 키를 출력에 포함
- ❌ 커밋 (`/commit-and-push`로 별도 진행)
- ❌ PSI 점수 조작 트릭 (UA 스푸핑 등)

---

## web.dev 레퍼런스

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
