---
name: seed-design
description: Analyze a service URL or screenshot and clone the full UI - design system, components, and page layout using Next.js, React, Tailwind CSS, and Framer Motion.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch, Task
user-invocable: true
---

# Seed Design — Full UI Clone Skill

너는 세계 최고의 **Full-stack UI Engineer**이자 **Design System Architect**야.
특정 서비스의 URL이나 스크린샷을 분석해서, Next.js + React + Tailwind CSS + Framer Motion 기반의 현대적인 코드로 재해석하고 복제하는 것이 네 임무야.

---

## Phase 0: 지식 로드

1. `memory/skills/seed-design-lessons.md` 파일을 읽는다 (없으면 skip)
2. 기존 교훈을 이번 클론 작업에 반영한다

---

## Input 파싱

사용자가 제공한 인자를 파싱한다:

- **URL인 경우** (`http://` 또는 `https://`로 시작): 페이지 분석 (Phase 1 참조)
  - URL에 경로가 있으면 (예: `https://example.com/image-edit`) **라우트 경로**를 추출한다 → `/image-edit`
  - 루트 URL이면 (예: `https://example.com` 또는 `https://example.com/`) 라우트 경로는 `/` (홈)
- **파일 경로인 경우** (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` 등): Read tool로 스크린샷 이미지를 시각적으로 분석
- **인자가 없는 경우**: 사용자에게 URL 또는 스크린샷 경로를 요청

---

## 모드 감지 (Mode Detection) ⭐

Input 파싱 직후, 프로젝트 상태를 확인하여 **실행 모드**를 결정한다.

### 감지 방법

다음 파일들의 존재 여부를 `Glob`으로 확인한다:

```
tailwind.config.ts
app/globals.css
lib/utils.ts
lib/animations.ts
components/ui/*.tsx
```

### 모드 판정

| 조건 | 모드 | 설명 |
|------|------|------|
| 위 파일들이 대부분 없음 | **Full 모드** | 디자인 시스템 + 컴포넌트 + 페이지 전체 생성 |
| 위 파일들이 이미 존재함 | **Page-Add 모드** | 기존 디자인 시스템 활용, 새 페이지만 추가 |

### 모드별 Phase 실행 흐름

| Phase | Full 모드 | Page-Add 모드 |
|-------|-----------|---------------|
| Phase 1: 분석 | O | O |
| Phase 2: 디자인 시스템 구축 | O | **SKIP** |
| Phase 3: 컴포넌트 생성 | O (전체) | **증분만** (새로 필요한 것만) |
| Phase 4: 페이지 클론 | `app/page.tsx` 생성 | `app/{route}/page.tsx` 생성 |
| Phase 4.5: 디테일 검증 | O | O |
| Phase 5: 검증 및 정리 | O | O |

### Page-Add 모드 시 사용자 확인

Page-Add 모드가 감지되면 다음을 출력한다:

```
기존 디자인 시스템이 감지되었습니다.
- tailwind.config.ts ✓
- globals.css ✓
- components/ui/ ✓
- lib/utils.ts ✓
- lib/animations.ts ✓

**Page-Add 모드**로 실행합니다:
- 디자인 시스템(Phase 2)을 건드리지 않습니다
- 기존 UI 컴포넌트를 재사용합니다
- 새 라우트 `app/{route}/page.tsx`에 페이지를 생성합니다
```

---

## Phase 1: 분석 (Analysis)

### URL 입력 시 — 2단계 추출 전략

대부분의 현대 웹사이트는 JavaScript SPA로 동적 렌더링되어 WebFetch만으로는 콘텐츠를 가져올 수 없다.
따라서 다음 **2단계 폴백 전략**을 사용한다:

#### Step 1: WebFetch 시도 (빠른 경로)
먼저 WebFetch로 페이지를 가져와 본다:
```
WebFetch(url, "이 페이지의 UI를 상세히 분석해줘: 레이아웃, 색상, 타이포, 컴포넌트 등")
```

**결과 판단 기준** — 다음 중 하나라도 해당하면 Step 2로 진행:
- 텍스트 콘텐츠가 거의 없음 (Google Analytics 스크립트만 있음)
- 레이아웃/색상/컴포넌트 정보를 추출할 수 없음
- "JavaScript로 렌더링되어..." 같은 한계 언급

#### Step 2: Playwright 동적 추출 (폴백)

WebFetch가 실패하면, Playwright headless 브라우저로 완전히 렌더링된 페이지를 추출한다.

**2-1. Playwright 임시 설치**
```bash
yarn add -D playwright
npx playwright install chromium
```

**2-2. 추출 스크립트 생성 및 실행**

`scripts/extract-page.mjs` 파일을 생성한다.

> **중요: 섹션별 스크린샷을 반드시 포함한다.** 풀페이지 스크린샷만으로는 세부 디테일(슬라이더 색상, 라벨 위치, 버튼 스타일, 배지 텍스트 등)을 정확히 파악할 수 없다. 900px 단위로 스크롤하면서 **섹션별 뷰포트 스크린샷**을 찍는다.

```javascript
import { chromium } from "playwright";
import { writeFileSync } from "fs";

const url = process.argv[2] || "https://example.com";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000); // SPA 렌더링 + 애니메이션 대기

  // 1) 전체 렌더링된 HTML 저장
  const html = await page.content();
  writeFileSync("scripts/extracted-page.html", html, "utf-8");
  console.log(`HTML saved (${html.length} chars)`);

  // 2) 디자인 토큰 추출 (computed styles)
  const designData = await page.evaluate(() => {
    const body = document.body;
    const computedBody = getComputedStyle(body);
    const colors = new Set();
    const fonts = new Set();
    const radii = new Set();
    const shadows = new Set();
    const allText = [];

    document.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.color && cs.color !== "rgba(0, 0, 0, 0)") colors.add(cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)")
        colors.add(cs.backgroundColor);
      if (cs.fontFamily) fonts.add(cs.fontFamily);
      if (cs.borderRadius && cs.borderRadius !== "0px") radii.add(cs.borderRadius);
      if (cs.boxShadow && cs.boxShadow !== "none") shadows.add(cs.boxShadow);

      if (el.children.length === 0 && el.textContent?.trim()
          && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
        const text = el.textContent.trim().substring(0, 200);
        if (text.length > 0) {
          allText.push({
            tag: el.tagName.toLowerCase(), text,
            fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color,
          });
        }
      }
    });

    const links = Array.from(document.querySelectorAll("a")).map((a) => ({
      text: a.textContent?.trim().substring(0, 100), href: a.getAttribute("href"),
    }));
    const images = Array.from(document.querySelectorAll("img")).map((img) => ({
      alt: img.alt, src: img.src?.substring(0, 200),
      width: img.naturalWidth, height: img.naturalHeight,
    }));
    const buttons = Array.from(
      document.querySelectorAll('button, [role="button"], a[class*="btn"]')
    ).map((btn) => ({
      text: btn.textContent?.trim().substring(0, 100),
      tag: btn.tagName.toLowerCase(),
      classes: btn.className?.substring?.(0, 200),
    }));

    return {
      title: document.title,
      colors: [...colors].slice(0, 50),
      fonts: [...fonts].slice(0, 10),
      radii: [...radii].slice(0, 20),
      shadows: [...shadows].slice(0, 10),
      textContent: allText.slice(0, 100),
      links: links.slice(0, 50),
      images: images.slice(0, 30),
      buttons: buttons.slice(0, 20),
      bodyBg: computedBody.backgroundColor,
      bodyColor: computedBody.color,
      bodyFont: computedBody.fontFamily,
    };
  });

  writeFileSync("scripts/extracted-design.json", JSON.stringify(designData, null, 2), "utf-8");
  console.log("Design data saved");

  // 3) 풀페이지 스크린샷
  await page.screenshot({ path: "scripts/screenshot-full.png", fullPage: true });
  console.log("Full-page screenshot saved");

  // 4) 섹션별 뷰포트 스크린샷 (900px 단위 스크롤)
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = 900;
  let scrollY = 0;
  let idx = 0;
  while (scrollY < totalHeight) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `scripts/screenshot-section-${idx}.png` });
    console.log(`Section ${idx} screenshot saved (scrollY=${scrollY})`);
    scrollY += viewportHeight;
    idx++;
  }

  await browser.close();
})();
```

실행:
```bash
node scripts/extract-page.mjs "TARGET_URL"
```

**2-3. 4가지 소스를 교차 분석**

추출된 데이터를 **모두** 활용하여 분석한다:

| 소스 | 읽는 방법 | 추출 정보 |
|------|-----------|-----------|
| `scripts/screenshot-full.png` | `Read` (이미지 시각 분석) | 전체 레이아웃, 시각적 계층구조, 색감, 여백 비율 |
| `scripts/screenshot-section-*.png` | `Read` (이미지 시각 분석) | **각 섹션의 정밀 디테일** — 슬라이더 색상, 버튼 그라디언트, 배지 텍스트, 라벨 위치, 카드 보더 등 |
| `scripts/extracted-design.json` | `Read` (JSON 파싱) | 정확한 computed 색상(rgb), 폰트, border-radius, box-shadow, 텍스트 콘텐츠, 버튼/링크 목록 |
| `scripts/extracted-page.html` | `Read`/`Grep` (구조 분석) | HTML 구조, 클래스명, 섹션 id, 컴포넌트 패턴, inline styles |

> **중요**: HTML 파일은 매우 클 수 있다 (minified SPA). `Read`의 `offset`/`limit`로 분할 읽기하거나, `Grep`으로 특정 섹션/클래스를 검색한다.

> **필수**: 섹션별 스크린샷을 모두 Read로 확인하여 디테일을 놓치지 않는다. 풀페이지 스크린샷은 축소되어 세부 디테일이 보이지 않는다.

**2-4. 임시 파일 정리** (Phase 5에서 수행)
```bash
rm -rf scripts/
yarn remove playwright
```

### 스크린샷 입력 시
Read tool로 이미지를 읽어 시각적으로 분석한다. 아래 체크리스트 항목을 분석.

### 분석 체크리스트 (15가지)

**레이아웃 & 구조:**
1. 전체 레이아웃 구조 (header, hero, sections, footer 등)
2. 각 섹션의 배경색/배경 처리 (그라디언트, 이미지 오버레이, 패턴 등)
3. 네비게이션 구조 (너비, 요소 배치, 드롭다운, 모바일 메뉴, 고정/플로팅 요소)

**비주얼 디자인:**
4. 색상 팔레트 (primary, secondary, accent, neutral, background, text — 정확한 hex 값)
5. 타이포그래피 (폰트 패밀리, 사이즈 체계, weight 체계, line-height, letter-spacing, 대/소문자)
6. 간격 체계 (padding, margin, gap 패턴)
7. 그림자, 테두리, border-radius, glow 패턴
8. 아이콘 체계 및 이미지 사용 패턴

**컴포넌트 디테일:**
9. 컴포넌트 목록 (Button, Card, Badge, Input 등 식별 가능한 모든 재사용 UI)
10. 슬라이더/비교 컴포넌트의 색상, 라인 두께, 핸들 스타일
11. 배지/태그의 정확한 텍스트 (대문자 여부, 언어)
12. 카드 내부 아이템의 레이아웃 방향 (수직/수평)
13. 라벨의 정확한 위치 (중앙/좌우 끝 등)

**인터랙션 & 기타:**
14. 애니메이션/인터랙션 패턴 (hover, scroll, transition, 3D 효과 등)
15. 플로팅 요소 (FAB, 채팅 위젯, 토스트 등)

### 분석 결과 정리

#### Full 모드일 때:
분석이 끝나면 아래 형식으로 요약을 **사용자에게 출력**한다:

```
## 디자인 분석 결과

**레이아웃**: [구조 요약]
**색상**: Primary(#xxx), Secondary(#xxx), Accent(#xxx), ...
**타이포그래피**: [폰트, 사이즈 체계]
**핵심 컴포넌트**: [식별된 컴포넌트 목록]
**애니메이션**: [주요 모션 패턴]
**플로팅 요소**: [FAB, 채팅 위젯 등]

이 분석을 기반으로 디자인 시스템과 페이지를 생성합니다.
진행할까요?
```

#### Page-Add 모드일 때:
기존 컴포넌트 목록을 먼저 확인한 뒤, 분석 결과를 출력한다:

```
## 페이지 분석 결과 (Page-Add 모드)

**라우트**: `app/{route}/page.tsx`
**레이아웃**: [구조 요약]
**핵심 섹션**: [식별된 섹션 목록]

### 기존 재사용 컴포넌트
- Button ✓ (components/ui/button.tsx)
- Card ✓ (components/ui/card.tsx)
- ...

### 새로 필요한 컴포넌트
- [ComponentName] — [용도 설명]
- ...

이 분석을 기반으로 페이지를 생성합니다.
진행할까요?
```

사용자 확인을 받은 후 다음 Phase로 진행한다.

---

## Phase 2: 디자인 시스템 구축 (Design System Seeding)

> **Page-Add 모드에서는 이 Phase를 전체 SKIP한다.**
> 기존 `tailwind.config.ts`, `globals.css`, `lib/utils.ts`, `lib/animations.ts`를 그대로 사용한다.

### Step 2-1: 패키지 설치 확인

`package.json`을 확인하여 필요한 패키지가 없으면 설치한다:
- `framer-motion` (필수)
- `lucide-react` (아이콘, 필요 시)
- `clsx` (조건부 클래스, 필요 시)
- `tailwind-merge` (Tailwind 클래스 병합, 필요 시)

```bash
yarn add framer-motion lucide-react clsx tailwind-merge
```

### Step 2-2: Tailwind Config 업데이트

`tailwind.config.ts`를 분석 결과 기반으로 업데이트한다:

```typescript
// 업데이트할 항목:
// - darkMode: "class" (class 기반 다크모드 필수)
// - colors: 분석에서 추출한 색상 팔레트 (CSS 변수 기반)
// - fontFamily: 분석에서 추출한 폰트
// - fontSize: 분석에서 추출한 타이포그래피 스케일
// - spacing: 커스텀 간격 (필요 시)
// - borderRadius: 분석에서 추출한 radius 패턴
// - boxShadow: 분석에서 추출한 그림자 패턴 (light/dark 분리)
// - screens: 반응형 breakpoints (필요 시)
// - animation/keyframes: Tailwind 레벨 애니메이션 (필요 시)
```

**규칙:**
- 기존 Tailwind 기본값은 유지하고 `extend` 안에서 확장
- CSS 변수(`var(--xxx)`) 기반으로 테마 토큰을 정의하여 다크모드 대응 가능하게
- 색상은 시맨틱 네이밍 사용 (primary, secondary, accent, muted, destructive 등)

### Step 2-3: 글로벌 CSS 업데이트

`app/globals.css`를 업데이트한다:
- CSS 변수로 색상 토큰 정의 (`:root` 라이트모드 및 `.dark` 다크모드)
- 기본 폰트 import (`next/font` 권장) 또는 `@import url(...)`
- gradient-text, 3D 버튼 효과, dot-grid 패턴 등 재사용 CSS 클래스
- glassmorphism 네비게이션 (`.glass-nav`) — 라이트/다크 분리
- 기본 스타일 리셋/정규화 (필요 시)

**CSS 작성 주의사항:**
- `radial-gradient`에서 autoprefixer 호환 구문 사용: `closest-side at X Y` (not `X Y, closest-side`)
- `mask-image`와 `-webkit-mask-image` 둘 다 작성
- `.dark .class-name` 패턴으로 다크모드 CSS 분리

### Step 2-4: 유틸리티 함수 생성

`lib/utils.ts` 파일을 생성한다:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`lib/animations.ts` 파일을 생성한다 (Framer Motion variants):

```typescript
import type { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

// ... 분석에서 파악한 패턴 기반으로 추가
```

---

## Phase 3: 재사용 컴포넌트 생성 (Component Library)

### Full 모드

`components/ui/` 디렉토리에 분석에서 식별된 컴포넌트를 생성한다.

### Page-Add 모드 (증분 생성)

> **기존 컴포넌트는 절대 수정하지 않는다.**

1. `Glob("components/ui/*.tsx")`로 기존 컴포넌트 목록을 확인한다
2. 분석에서 식별된 컴포넌트 중 **기존에 없는 것만** 새로 생성한다
3. 기존 컴포넌트의 variant가 부족한 경우 (예: Button에 새 variant 필요), **기존 파일에 variant를 추가**하되 기존 코드를 깨트리지 않도록 주의한다
4. 새 페이지에만 필요한 복합 컴포넌트는 `components/sections/{route}/` 안에 인라인으로 구현하거나, 재사용 가능성이 높으면 `components/ui/`에 생성한다

#### Page-Add 모드 — 디자인 토큰 매핑 규칙 ⭐ 필수

> **원본 사이트의 색상을 그대로 쓰지 않는다. 반드시 기존 프로젝트의 디자인 토큰으로 매핑한다.**

Phase 1에서 추출한 원본 색상(rgb/hex)은 **참고용**이다. 코드에는 기존 `tailwind.config.ts`와 `globals.css`에 정의된 시맨틱 토큰만 사용한다.

**코드 작성 전, 기존 토큰을 먼저 확인한다:**
```bash
# 1) tailwind.config.ts의 colors 섹션 확인
# 2) globals.css의 CSS 변수 확인
# 3) 기존 섹션 컴포넌트에서 사용하는 클래스 패턴 확인
```

**매핑 예시:**

| 원본 사이트 색상 | ❌ 하면 안 되는 것 | ✅ 해야 하는 것 |
|---|---|---|
| 파란색 (#3B82F6 등) | `text-blue-500`, `bg-blue-500` | `text-primary`, `bg-primary` |
| 흰색 텍스트 | `text-white` | `text-foreground` |
| 회색 텍스트 | `text-slate-300`, `text-gray-400` | `text-muted-foreground` |
| 카드 배경 | `style={{ background: "#151519" }}` | `bg-card` |
| 보더 | `border-white/10` | `border-border` |
| 비활성 배경 | `bg-white/10` | `bg-muted` |
| CTA 버튼 그래디언트 | `from-blue-500 to-blue-600` | `from-indigo-600 to-violet-500` + `btn-glow` |
| 추천 카드 보더/글로우 | 인라인 shadow | `pricing-recommended` 등 기존 CSS 클래스 |
| 그림자 | 하드코딩 shadow | `shadow-glow-indigo` 등 기존 boxShadow 토큰 |

**기존 코드 패턴을 따른다:**
- 같은 역할의 기존 컴포넌트가 있으면(예: 랜딩의 `pricing.tsx` 섹션), 해당 파일의 클래스 패턴을 **그대로 답습**한다
- 기존 `components/ui/` 컴포넌트를 최대한 import하여 사용한다 (Badge, Button, SectionWrapper 등)
- `globals.css`에 정의된 유틸 클래스(`btn-glow`, `glass-card`, `pricing-recommended` 등)를 활용한다

### 컴포넌트 작성 규칙

1. **파일 구조**: `components/ui/{component-name}.tsx`
2. **명명 규칙**: PascalCase 컴포넌트, kebab-case 파일
3. **스타일링**: Tailwind CSS 클래스만 사용 (인라인 스타일은 동적 값에만)
4. **variants**: props로 variant, size 등을 받아 다양한 스타일 지원
5. **모션**: 인터랙션이 있는 컴포넌트는 Framer Motion 적용
6. **타입**: TypeScript interface로 props 정의, `React.ComponentPropsWithoutRef` 확장
7. **접근성**: 시맨틱 HTML, ARIA 속성, 키보드 네비게이션 고려
8. **cn() 유틸**: 모든 className 조합에 `cn()` 사용
9. **다크/라이트 모드**: 모든 컴포넌트에서 `dark:` 프리픽스로 다크모드 스타일 분리

### 컴포넌트 우선순위 (분석에서 식별된 것만 생성)

1. **ThemeToggle** - 다크/라이트 전환 (localStorage + class 기반)
2. **Button** - 가장 기본, variant/size 지원
3. **Badge** - 상태/라벨/카테고리 표시
4. **Card** - 콘텐츠 컨테이너
5. **SectionWrapper** - motion viewport 기반 섹션 래퍼
6. **Input / Form elements** - 폼 요소
7. **기타** - 분석에서 식별된 고유 컴포넌트

### Framer Motion 적용 기준

- **hover/tap**: 버튼, 카드 등 인터랙티브 요소 (`whileHover`, `whileTap`)
- **scroll reveal**: 섹션 진입 시 fade-in, slide-up (`whileInView` + `viewport: { once: true }`)
- **stagger**: 여러 자식 요소 순차 등장 (`staggerContainer` + `variants`)
- **AnimatePresence**: 드롭다운, 모바일 메뉴, 아코디언 등 진입/퇴장 애니메이션
- **layout animation**: 탭 전환, 리스트 아이템 변경 시

---

## Phase 4: 페이지 클론 (Page Clone)

### Step 4-1: 레이아웃 구성

#### Full 모드
`app/layout.tsx`를 업데이트한다:
- **폰트**: `next/font/google`로 적용 (CSS `@import` 대신 — 성능 최적)
- 한글 폰트(Pretendard 등)는 `next/font/local`로 woff2 다운로드 후 로컬 로드
- `<html className="dark">` 기본값 설정 (다크모드 기본)
- 메타데이터 업데이트 (title, description, og:image 등)
- `suppressHydrationWarning` 추가 (hydration mismatch 방지)

#### Page-Add 모드
`app/layout.tsx`는 **수정하지 않는다** (기존 레이아웃을 상속받음).

필요 시 라우트 전용 레이아웃을 `app/{route}/layout.tsx`에 생성할 수 있다:
- 해당 페이지에만 필요한 네비게이션/레이아웃 변경이 있는 경우
- 공통 레이아웃과 다른 구조가 필요한 경우

### Step 4-2: 섹션별 컴포넌트 생성

#### Full 모드 — 기존과 동일
페이지를 섹션 단위로 분리하여 `components/sections/`에 생성:
- `components/sections/navigation.tsx`
- `components/sections/hero.tsx`
- `components/sections/features.tsx`
- 등

#### Page-Add 모드 — 라우트별 네임스페이스
기존 섹션 컴포넌트와 충돌을 방지하기 위해 **라우트별 하위 디렉토리**에 생성한다:

```
components/sections/{route}/
├── {route}-hero.tsx        (또는 해당 페이지의 주요 섹션명)
├── {route}-editor.tsx
├── {route}-features.tsx
└── ...
```

예시 (`/image-edit` 페이지):
```
components/sections/image-edit/
├── image-edit-hero.tsx
├── image-edit-canvas.tsx
├── image-edit-toolbar.tsx
├── image-edit-sidebar.tsx
└── ...
```

**네이밍 규칙:**
- 파일명에 라우트 prefix를 붙여 전역 검색 시 쉽게 구분
- 기존 `components/sections/navigation.tsx` 같은 공통 컴포넌트는 **import하여 재사용** (복제 X)

각 섹션 컴포넌트 규칙:
- **반응형**: mobile-first, `sm:`, `md:`, `lg:` breakpoint 활용
- **모션**: 스크롤 기반 reveal 애니메이션 적용 (Framer Motion `whileInView`)
- **데이터**: 하드코딩 대신 가능한 한 상수/배열로 구조화 (map으로 렌더링)
- **이미지**: placeholder는 Tailwind 그라디언트로 대체 (아래 이미지 제약사항 참조)
- **아이콘**: `lucide-react`에서 가장 유사한 아이콘 선택
- **텍스트**: 원본의 텍스트를 **정확히** 사용한다 (extracted-design.json의 textContent 참조)
- **색상 (Page-Add 모드)**: 원본 사이트의 raw 색상이 아니라 **기존 디자인 토큰**을 사용한다 (Phase 3의 "디자인 토큰 매핑 규칙" 참조)

### Step 4-3: 페이지 조합

#### Full 모드
`app/page.tsx`에서 섹션 컴포넌트를 조합:

```tsx
import { Navigation } from "@/components/sections/navigation";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
// ...

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <Hero />
      <Features />
      {/* ... */}
      <DiscordFab /> {/* 플로팅 요소도 잊지 말 것 */}
    </div>
  );
}
```

#### Page-Add 모드
`app/{route}/page.tsx`에 새 페이지를 생성한다:

```tsx
import { Navigation } from "@/components/sections/navigation"; // 공통 컴포넌트 재사용
import { ImageEditHero } from "@/components/sections/image-edit/image-edit-hero";
import { ImageEditCanvas } from "@/components/sections/image-edit/image-edit-canvas";
// ...

export default function ImageEditPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <Navigation /> {/* 기존 GNB 재사용 */}
      <ImageEditHero />
      <ImageEditCanvas />
      {/* ... */}
    </div>
  );
}
```

**Page-Add 모드 주의사항:**
- `app/page.tsx`는 **절대 수정하지 않는다**
- 기존 Navigation, Footer 등 공통 섹션은 import하여 재사용
- 해당 페이지에서만 Navigation이 다르게 보여야 하면, props로 variant를 전달하거나 별도 네비게이션 컴포넌트를 만든다

---

## Phase 4.5: 디테일 검증 (Detail Verification) ⭐ 중요

> **이 단계는 Phase 4와 Phase 5 사이에 반드시 수행한다.**
> 첫 번째 구현에서 놓치기 쉬운 디테일을 잡는 핵심 단계이다.

### 섹션별 스크린샷 교차 검증

`scripts/screenshot-section-*.png`을 하나씩 Read로 열어보면서, 해당 섹션의 구현 코드와 비교한다.

**체크 항목:**

| 카테고리 | 자주 놓치는 디테일 |
|---------|-------------------|
| **Hero** | 배경 이미지 오버레이 유무, 이미지가 전체 화면을 덮는지, 텍스트 정확도 |
| **GNB** | 너비 (max-w 값), 요소 배치 순서, 서브텍스트 대/소문자, 테마 토글 위치 |
| **슬라이더** | 라인 색상 (blue vs white vs gradient), 핸들 스타일, Before/After 라벨 위치 |
| **탭/버튼** | selected 상태 스타일, 보더 유무, 패딩 차이 |
| **배지** | 정확한 텍스트, 대문자 여부, 언어 (한국어 vs 영어) |
| **카드** | 내부 레이아웃 방향 (수직 vs 수평), 보더 glow 유무, 배경색 |
| **라벨** | 위치 (중앙 vs 좌우 끝), 정확한 텍스트 |
| **Footer** | 회사 정보 (주소, 전화, 사업자번호), 언어 전환, SNS 링크 |
| **플로팅** | FAB 버튼, 채팅 위젯, 스크롤 투 탑 등 |
| **섹션 배경** | 각 섹션별 배경색 차이, 컨테이너 카드 유무 |

### 자주 발생하는 실수 패턴

1. **GNB가 너무 좁음**: `max-w-5xl` → 원본에 맞는 적절한 너비 사용 (보통 `max-w-6xl` 이상)
2. **Hero 배경 이미지 누락**: 원본에 풀블리드 배경 이미지+오버레이가 있는데 그라디언트만 넣음
3. **텍스트 부정확**: "흐릿한 디테일" → "흐린 디테일" 등으로 바꿔버림 (extracted-design.json 참조)
4. **슬라이더 색상 불일치**: 첫 번째 슬라이더는 blue, 두 번째는 white인데 둘 다 같은 색으로 구현
5. **라벨 위치**: "원본 이미지" / "AI 업스케일"이 각 이미지 아래 중앙이 아니라 좌우 끝에 위치
6. **배지 언어/대소문자**: "✨ 피부 리얼리즘" vs "✨ ULTRA SKIN ENHANCEMENT"
7. **카드 아이템 레이아웃**: 아이콘+텍스트가 수직(위아래)이 아니라 수평(좌우)
8. **Footer 세부정보 누락**: 회사 주소, 전화번호, 사업자번호, 언어 전환 등
9. **플로팅 요소 누락**: Discord FAB, 채팅 위젯 등
10. **섹션 래핑**: 특정 섹션이 카드 컨테이너(보더+그림자)로 감싸져 있는데 무시함

### Page-Add 모드 추가 체크

11. **기존 디자인 시스템 준수 (필수)**: 새 코드에 원본 사이트의 raw 색상(`blue-500`, `slate-300`, `text-white` 등)이 남아있지 않은지 **Grep으로 검색**한다. 발견되면 기존 토큰(`primary`, `foreground`, `muted-foreground`, `card`, `border` 등)으로 교체한다. 기존 섹션 컴포넌트(예: `components/sections/pricing.tsx`)와 동일한 클래스 패턴을 사용하는지 확인한다.
12. **공통 컴포넌트 재사용 누락**: Navigation, Footer 등을 복제하지 않고 import했는지 확인
13. **라우팅 연결**: 기존 Navigation에 새 페이지로의 링크가 필요하면 사용자에게 안내

---

## Phase 5: 검증 및 정리 (Verification & Cleanup)

### 빌드 확인
```bash
yarn build
```

빌드 에러가 있으면 수정한다. 타입 에러, import 누락, 미사용 변수 등을 해결.

### 흔한 빌드 에러와 해결

| 에러 | 원인 | 해결 |
|------|------|------|
| `Do not use <a> to navigate to /` | Next.js ESLint — 내부 경로에 `<a>` 사용 | `next/link`의 `<Link>` 컴포넌트 사용 |
| `autoprefixer: Gradient has outdated direction syntax` | CSS radial-gradient 구문 비호환 | `50% 40%` → `closest-side at 50% 50%` 형태로 수정 |
| `'X' is defined but never used` | 미사용 import | 해당 import 제거 |
| `Type 'X' is not assignable to type 'Y'` | Framer Motion props 타입 불일치 | `HTMLMotionProps<"tag">` 사용 |
| `require() of ES modules is not supported` | `require` 대신 `import` 필요 | ESM import로 변경 |

### 임시 파일 정리

Playwright 추출에 사용된 임시 파일을 정리한다:
```bash
rm -rf scripts/
yarn remove playwright  # devDependencies에서 제거
```

### 최종 보고

#### Full 모드

```
## Seed Design 완료

### 생성된 파일
- `tailwind.config.ts` — 디자인 토큰 (색상, 타이포, 간격, 그림자 등)
- `app/globals.css` — CSS 변수 및 글로벌 스타일 (라이트/다크)
- `lib/utils.ts` — cn() 유틸리티
- `lib/animations.ts` — Framer Motion variants
- `components/ui/...` — UI 컴포넌트
- `components/sections/...` — 페이지 섹션 컴포넌트
- `app/page.tsx` — 메인 페이지

### 디자인 시스템 요약
- Colors: [사용된 색상 토큰]
- Typography: [폰트 및 사이즈 스케일]
- Components: [생성된 컴포넌트 목록]

### 다음 단계
- `yarn dev`로 로컬에서 확인
- 필요 시 색상/간격 미세 조정
- 실제 이미지/아이콘 교체
```

#### Page-Add 모드

```
## 페이지 추가 완료 (Page-Add 모드)

### 새 라우트
`app/{route}/page.tsx`

### 생성된 파일
- `app/{route}/page.tsx` — 페이지 엔트리
- `components/sections/{route}/...` — 페이지 전용 섹션 컴포넌트
- `components/ui/...` — 새로 추가된 UI 컴포넌트 (있는 경우)

### 재사용된 기존 요소
- 디자인 시스템: tailwind.config.ts, globals.css (수정 없음)
- UI 컴포넌트: [재사용된 컴포넌트 목록]
- 섹션 컴포넌트: [재사용된 섹션 목록 — Navigation, Footer 등]

### 다음 단계
- `yarn dev`로 로컬에서 `/{route}` 확인
- 기존 Navigation에 새 페이지 링크 추가 검토
- 실제 이미지/아이콘 교체
```

---

## 주의사항

### 이미지 제약사항 ⭐

> **AI는 외부 URL의 이미지를 직접 불러오거나 삽입할 수 없다.**

- 원본 사이트의 이미지 URL을 알고 있어도 코드에 직접 사용할 수 없다
- Hero 배경 이미지, 포트폴리오 이미지, 인물 사진 등은 **Tailwind 그라디언트 placeholder**로 대체한다
- Placeholder 전략:
  - **인물 사진**: 피부 톤을 연상시키는 따뜻한 그라디언트 (`from-amber-200 via-rose-100 to-pink-200`)
  - **Hero 배경**: 다층 그라디언트 + blur로 분위기 재현 (피부색 영역 + 어두운 오버레이 + 앰비언트 라이트)
  - **제품/UI 이미지**: 중립적 그라디언트 + 이모지 또는 아이콘으로 의미 전달
- `next/image`는 외부 도메인 설정이 필요하므로, placeholder에는 순수 div + 그라디언트를 사용한다
- 사용자에게 "다음 단계"에서 실제 이미지 교체를 안내한다

### 코드 품질
- 모든 코드는 TypeScript strict mode 호환이어야 한다
- `"use client"` 디렉티브는 Framer Motion, useState, 이벤트 핸들러 등 클라이언트 기능을 사용하는 컴포넌트에만 추가
- 내부 라우팅에는 반드시 `next/link`의 `<Link>` 사용 (`<a href="/">` 금지)
- `require()` 사용 금지 — ESM `import`만 사용
- 이미지에 `next/image` 사용 시 `width`/`height` 또는 `fill` 지정

### 저작권
- **절대로** 원본 서비스의 로고, 상표, 브랜드 에셋을 그대로 복제하지 않는다
- 이미지는 placeholder (gradient, solid color, 도형)로 대체한다
- 텍스트 콘텐츠는 원본의 구조를 따르되, 필요 시 의미는 유지하면서 변경 가능
- 외부 API 호출이나 인증이 필요한 동적 기능은 제외하고, UI/레이아웃만 복제한다

---

## 지식 저장 (완료 후)

클론 작업 중 발견한 새로운 교훈을 `memory/skills/seed-design-lessons.md`에 기록한다.
기존 교훈과 중복되면 skip.

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```
