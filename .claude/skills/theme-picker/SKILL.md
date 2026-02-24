---
name: theme-picker
description: Generate diverse tone & manner preview palettes for the current project, display them in a single HTML comparison page, and apply the selected option across the entire codebase. Use when discussing color schemes, design systems, themes, tone & manner, or when the user asks to "change the theme", "pick colors", or "show palette options".
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

# Theme Picker — 톤앤매너 프리뷰 & 적용 스킬

너는 **Senior Brand Designer + Design System Engineer**야.
이 프로젝트의 서비스 성격, 핵심 타겟, 전체 무드를 고려해서 다양한 컬러 팔레트 후보를 만들고, 사용자가 직접 비교·선택할 수 있도록 프리뷰 HTML을 생성한 뒤, 선택된 팔레트를 코드베이스 전체에 적용하는 것이 네 임무야.

---

## Phase 0: 지식 로드 + 서비스 분석 (자동 — 사용자 확인 없이 바로 진행)

> **중요**: 분석 결과를 사용자에게 보여주고 확인 받지 마라. 분석 후 바로 Phase 1 → Phase 2까지 한번에 진행하여 HTML을 생성하라. 사용자가 기다리는 시간을 최소화해야 한다.

스킬 실행 시 가장 먼저:
1. `memory/skills/theme-picker-lessons.md` 파일을 읽는다 (없으면 skip)
2. 기존 교훈을 이번 실행에 반영한다
3. 프로젝트를 분석한다 (아래).

### 0-1. 프로젝트 컨텍스트 파악

아래 파일들을 읽어서 서비스를 이해한다:

```
app/page.tsx          → 전체 섹션 구조, 서비스 성격
app/globals.css       → 현재 CSS 변수 & 컴포넌트 클래스
tailwind.config.ts    → 현재 디자인 토큰
components/sections/  → 실제 UI에 사용된 색상 클래스
components/ui/        → 컴포넌트의 variant별 색상
```

### 0-2. 핵심 타겟 & 무드 정의

분석 결과를 바탕으로 다음을 판단한다:

- **서비스 타입**: SaaS, 이커머스, 크리에이터 툴, 미디어, 핀테크 등
- **핵심 타겟**: 개발자, 디자이너, 일반 소비자, 크리에이터, B2B 등
- **무드 키워드**: 예) "Professional + Futuristic + Trust" 또는 "Playful + Bold + Creative"
- **경쟁 서비스 컬러**: 피해야 할 색상 조합 (차별화 목적)

---

## Phase 1: 팔레트 후보 생성

### 1-1. 옵션 수 결정

- `$ARGUMENTS`가 숫자이면 해당 개수만큼 생성
- 인자가 없으면 **6개 + 현재 팔레트 1개 = 7개** 기본 생성
- 최소 4개, 최대 8개 (현재 팔레트 포함)

### 1-2. 현재 팔레트 반드시 포함

> **필수**: 첫 번째 옵션은 반드시 현재 적용 중인 팔레트여야 한다. `globals.css`에서 현재 `--primary`, `--secondary`, `--background` 등을 읽어서 그대로 옵션 1로 생성하고 `(현재 적용)` 라벨을 붙인다. 사용자가 "현재 그대로 유지"를 선택할 수 있어야 한다.

### 1-3. 팔레트 설계 원칙

각 옵션은 다음 토큰을 **모두** 정의해야 한다:

| 토큰 | 설명 | 예시 |
|------|------|------|
| `name` | 팔레트 이름 (영문) | "Neon Mint" |
| `tag` | 한줄 분위기 태그 | "Fresh · Futuristic · Energy" |
| `primary` | 메인 액션 색상 | `#34D399` |
| `secondary` | 보조/그라디언트 끝 색상 | `#A78BFA` |
| `darkBg` | 다크모드 배경 | `#060E0C` |
| `darkCard` | 다크모드 카드 배경 | `#0D1916` |
| `darkMuted` | 다크모드 muted 영역 | `#162922` |
| `darkBorder` | 다크모드 보더 (primary 기반 rgba) | `rgba(52,211,153,0.10)` |
| `glowRgb` | glow 효과용 RGB 값 | `52,211,153` |

### 1-4. 다양성 보장

옵션들은 반드시 **시각적으로 확연히 구분되는** 조합이어야 한다.
아래 카테고리 중 최소 4개 이상 커버:

- **Cool Tech**: Emerald, Cyan, Teal 계열 (AI/테크 무드)
- **Warm Premium**: Amber, Gold, Orange 계열 (프리미엄/럭셔리)
- **Bold Vibrant**: Rose, Coral, Magenta 계열 (감성적/임팩트)
- **Nature Energy**: Lime, Green, Teal 계열 (에너지/자연)
- **Deep Purple**: Violet, Purple, Fuchsia 계열 (크리에이티브/미스터리)
- **Electric Neon**: Electric Blue, Neon Pink, Lime 계열 (미래지향/게이밍)
- **Earthy Calm**: Sage, Khaki, Terracotta 계열 (미니멀/자연)
- **Monochrome+**: 무채색 + 단일 Accent 포인트 (세련된/미니멀)

배경도 옵션마다 다르게:
- Deep Navy (`#0A0F1A`)
- Near Black (`#09090B`)
- Warm Dark (`#0F0D0A`)
- Cool Gray (`#111116`)
- Deep Forest (`#060E0C`)
- etc.

---

## Phase 2: 프리뷰 HTML 생성

`public/theme-preview.html` 파일을 생성한다.

### 2-1. HTML 구조 요구사항

하나의 셀프 컨테인드 HTML 파일로 (외부 의존성 없음):

1. **헤더 영역**
   - 서비스명, 핵심 타겟, 무드 키워드 표시
   - "클릭해서 선택하세요" 안내 문구

2. **옵션 카드 그리드** (2~3열)
   - 각 카드에 포함할 요소:
     - 팔레트 번호 + 이름 + 무드 태그
     - 색상 스와치 (primary, secondary, darkBg, darkCard, darkMuted — 5개)
     - **미니 UI 프리뷰** (해당 팔레트가 적용된 느낌):
       - 다크 배경 위에 글래스모피즘 카드
       - 배지 (primary 컬러 tint 배경 + 텍스트)
       - 그라디언트 텍스트 (primary → secondary)
       - CTA 버튼 (primary → secondary 그라디언트 + glow shadow)
       - 미세한 배경 glow blob 효과
       - 기능 요약 row (dot 아이콘 + 텍스트)
     - 현재 적용 중이면 `현재 적용` 라벨 표시
   - 클릭 시 `active` 클래스 토글 (흰색 보더)

3. **스타일**
   - 전체 페이지 배경: 가장 어두운 neutral (`#06080C` 추천)
   - 각 카드의 배경색 = 해당 팔레트의 `darkBg` 값
   - 카드 hover시 해당 팔레트의 glow shadow
   - 선택된 카드: 흰색 border + ring
   - 반응형 (mobile 1열, tablet 2열, desktop 3열)

### 2-2. 프리뷰의 미니 UI는 실제 서비스와 유사하게

단순 색상 칩이 아니라, 실제 서비스의 UI 요소를 축소 재현해야 한다:
- 실제 badge 텍스트 사용 (예: "✨ AI ENHANCEMENT")
- 실제 headline 텍스트 사용 (예: "차원이 다른 피부 리얼리즘")
- 실제 CTA 텍스트 사용 (예: "시작하기")
- 실제 feature 텍스트 사용 (예: "정체성 보존 · 실제 질감 · 3D 음영")
- 글래스모피즘 카드 느낌 포함

### 2-4. 프리뷰 CTA 버튼의 그라디언트 표현

> **중요**: 프리뷰 HTML의 CTA 버튼 그라디언트는 **동일 색상 계열 내 미세한 명도 차이**로 표현한다.
> 예: `linear-gradient(135deg, indigo-600, indigo-400)` — 같은 인디고 내에서 어두운→밝은 방향.
> 크로스 컬러 그라디언트 (예: 초록→보라) 는 과하므로 피한다.

### 2-3. CSS는 옵션별로 클래스로 분리

각 옵션의 색상은 `.opt1`, `.opt2` 등의 CSS 클래스에 옵션별 스타일을 정의한다. 이렇게 하면 HTML 구조를 반복하면서 클래스만 바꾸면 된다.

---

## Phase 3: 사용자 선택 대기

프리뷰 생성 후 사용자에게 안내:

```
프리뷰 페이지를 생성했습니다:

👉 http://localhost:3000/theme-preview.html

{옵션 수}가지 팔레트를 비교해보세요.
원하는 옵션의 번호나 이름을 알려주시면 바로 적용합니다.
```

**표 형태로 옵션 요약도 제공한다:**

```
| # | 이름 | 무드 | Primary → Secondary |
|---|------|------|---------------------|
| 1 | Neon Mint (현재 적용) | Fresh · Futuristic | #34D399 → #A78BFA |
| 2 | ... | ... | ... |
```

사용자가 번호 또는 이름으로 선택하면 Phase 4로 진행.

---

## Phase 4: 선택된 팔레트 적용

### 4-1. 수정 대상 파일 자동 탐색

> **중요 (레슨런)**: `Grep` 도구가 특정 환경에서 rgba 등 특수문자가 포함된 패턴을 찾지 못할 수 있다. 이 경우 `Bash`의 `grep -rn` 명령을 폴백으로 사용한다.

```bash
# Grep 도구 실패 시 폴백:
grep -rn "현재_primary_색상명" --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next"
grep -rn "현재_hex값" --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next"
```

### 4-2. 수정 대상 분류 (2계층)

색상 참조는 **두 가지 계층**으로 나뉜다. 반드시 둘 다 수정해야 한다:

#### 계층 1: CSS 변수 (globals.css) — 자동 전파됨
| 변수 | 설명 |
|------|------|
| `:root` & `.dark`의 `--primary`, `--secondary`, `--accent`, `--info`, `--success` | 시맨틱 색상 변수 |
| `.dark`의 `--background`, `--card`, `--muted`, `--border` | 다크모드 배경/표면 |
| `.glass-*` 클래스의 `rgba()` 값 | 글래스모피즘 보더 |
| `.gradient-text`의 `linear-gradient` | 그라디언트 텍스트 |
| `.hero-gradient`의 `radial-gradient` | Hero 배경 glow |
| `.btn-glow`의 `box-shadow` | 버튼 glow |
| `.slider-line`의 `linear-gradient` | 슬라이더 |
| `.pricing-highlight`의 `border` & `box-shadow` | 가격 카드 하이라이트 |

#### 계층 2: Tailwind 하드코딩 클래스 — 개별 수정 필요
| 파일 | 패턴 | 예시 |
|------|------|------|
| `components/ui/button.tsx` | glow variant `from-{color} to-{color}` | `from-indigo-600 to-indigo-400` |
| `components/sections/hero.tsx` | CTA `from-{color} to-{color}`, ambient light `from-{color}/opacity` | `from-indigo-600 to-indigo-400`, `from-indigo-500/15` |
| `components/sections/skin-realism.tsx` | badge 색상, border, shadow rgba, CTA | `indigo-500/20`, `text-indigo-400`, `from-indigo-600 to-indigo-400` |
| `components/sections/pricing.tsx` | 추천 CTA 그라디언트 | `from-indigo-600 to-indigo-400` |
| `components/sections/cta-section.tsx` | CTA 그라디언트 | `from-indigo-600 to-indigo-400` |
| `tailwind.config.ts` | `boxShadow` 키 이름 & rgba 값 | `glow-indigo`, `rgba(99,102,241,...)` |

### 4-3. 적용 전략

1. **globals.css 먼저** — CSS 변수 값과 모든 `rgba()` 값을 한번에 교체 (`replace_all` 활용)
2. **tailwind.config.ts** — boxShadow rgba 값 교체 + 키 이름 변경
3. **컴포넌트 파일들** — Tailwind 유틸리티 클래스 교체 (`from-{old}` → `from-{new}`)
4. 하드코딩된 `rgba(R,G,B,` 패턴도 전역 교체

> **주의**: `Edit`의 `replace_all: true`를 적극 활용하여 파일 내 모든 인스턴스를 한번에 교체한다.

### 4-4. Tailwind 색상 매핑 가이드

팔레트의 hex 값과 가장 가까운 Tailwind 클래스를 선택한다:

| Primary hex | Tailwind 클래스 |
|-------------|-----------------|
| `#34D399` | `emerald-400` |
| `#10B981` | `emerald-500` |
| `#8B5CF6` | `violet-500` |
| `#6366F1` | `indigo-500` |
| `#F43F5E` | `rose-500` |
| `#F59E0B` | `amber-500` |
| `#0EA5E9` | `sky-500` |
| `#A855F7` | `purple-500` |
| `#EC4899` | `pink-500` |
| `#A78BFA` | `violet-400` |

### 4-5. 검증

```bash
npm run build
```

빌드 성공 확인 후, 이전 팔레트의 잔여 참조를 확인:

```bash
# Bash grep으로 확인 (Grep 도구보다 확실함)
grep -rn "이전_primary_hex" --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next"
grep -rn "이전_tailwind_색상명" --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v ".next"
```

잔여 참조가 있으면 추가 수정.

---

## Phase 5: 결과 보고

```
## 팔레트 적용 완료: {선택된 팔레트 이름}

### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| globals.css | CSS 변수, glass rgba, gradient, glow |
| tailwind.config.ts | boxShadow rgba + 키 이름 |
| button.tsx | glow variant gradient |
| hero.tsx | CTA gradient, ambient light |
| ... | ... |

### 빌드 결과: ✅ 성공
### 잔여 참조: 0건

다른 팔레트로 변경하고 싶으시면 `/theme-picker`를 다시 실행해주세요.
```

---

## 주의사항

- **warning 색상 (#F59E0B)은 변경하지 않는다** — 시맨틱 경고 색상으로 팔레트와 독립적. 단, Golden Hour 팔레트처럼 primary가 amber인 경우 warning과 충돌할 수 있으므로 주의
- **폰트, border-radius, 글래스모피즘 구조는 변경하지 않는다** — 색상만 교체
- **라이트모드 neutral (white/slate)은 유지한다** — 다크모드 배경 + 포인트 컬러만 변경
- 프리뷰 HTML은 `public/` 안에 생성하여 dev 서버에서 바로 접근 가능하게
- 이전 프리뷰 파일이 존재하면 덮어쓰기

---

## 지식 저장 (완료 후)

팔레트 적용 중 발견한 새로운 교훈을 `memory/skills/theme-picker-lessons.md`에 기록한다.
기존 교훈과 중복되면 skip.

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```
