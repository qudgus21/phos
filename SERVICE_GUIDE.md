# PHOS — Service & Project Guide

> 이 문서는 PHOS 프로젝트의 **전체 맥락**을 담고 있습니다.
> 서비스 비전, 기능 명세, 기술 아키텍처, 디자인 시스템, DB 스키마, AI 통합 전략,
> 코딩 컨벤션까지 — 이 문서 하나로 프로젝트를 완전히 이해할 수 있어야 합니다.

---

## 1. 서비스 개요

| 항목 | 내용 |
|---|---|
| **서비스명** | PHOS (포스) |
| **성격** | AI 기반 하이엔드 실사 이미지 보정 · 편집 · 생성 SaaS |
| **타겟 유저** | 이커머스 셀러, 마케터, 상업용 고퀄리티 이미지가 필요한 디자이너 |
| **해결하는 문제** | 저화질 소스 → 브랜드 신뢰도 하락, 전문 보정사 고용 비용 |
| **핵심 차별점** | Photorealistic(실사) 특화. 애니메이션/일러스트 톤 아님. 상업 인쇄물 수준 해상도. |
| **URL** | 배포: Vercel (GitHub main → 자동 배포) |
| **레포** | `https://github.com/qudgus21/phos` |

---

## 2. 핵심 기능 (Features)

PHOS는 3개의 독립 도구 페이지 + 1개의 예정 기능으로 구성됩니다.

### 2-A. 스킨 리터칭 (`/retouching`)

**목적**: 인물 사진의 피부를 프로페셔널 수준으로 보정.

| 설정 항목 | 옵션 |
|---|---|
| 필터 | 없음 / 스튜디오 / 흰피부 (각 강도 슬라이더 0~100) |
| 보정 모드 | 보정(기본) / 보정(메이크업) / 보정(매트메이크업) / 물광보정 |
| 성별 | 여성 / 남성 |
| 인종 | 동양인 / 서양인 |
| 보정 제외 영역 | 입술 / 눈썹 / 코 / 헤어 / 배경 / 의상 (체크박스) |
| 이미지 스케일 | 0~2x |
| 크레딧 | 80 / 생성 |

**UI 레이아웃**: 3패널 (입력 | 결과 | 히스토리), 모바일은 탭 전환.

**AI 전략**: 유저에게 모델 선택을 노출하지 않음. 내부적으로 모드/필터에 따라 프롬프트 분기.
- 추천 엔진: **Flux Pro 1.1** (img2img) via Replicate
- 대안: Seedream 5.0, GPT Image 1.5

---

### 2-B. 얼굴 편집 (`/face-edit`)

**목적**: 마스크로 선택한 얼굴 영역을 새로운 얼굴로 교체/변환.

| 설정 항목 | 옵션 |
|---|---|
| 성별 | 여성 / 남성 |
| 변화 강도 | 0.5 ~ 1.0 |
| 결과 크기 | 0.5 ~ 2.0 |
| 마스크 도구 | 그리기(draw) / 지우기(erase) / 사각형(rect), 브러시 크기 2~80px |
| 크레딧 | 85 / 생성 |

**마스크 에디터 기술**:
- Canvas API 기반, `use-mask-canvas.ts` 훅으로 구현
- Undo/Redo (최대 30단계), 우클릭 지우기
- PNG blob + dataURL로 마스크 export
- 1:1 픽셀 매핑 (CSS 크기 = Canvas 해상도)

**UI 레이아웃**: 사이드바(샘플 5개) + 에디터 패널 + 히스토리 패널.

**AI 전략**:
- 추천 엔진: **Easel AI Advanced Face Swap** via Fal.ai ($0.05/장, 상업 라이선스 OK)
- 대안: Flux Pro + ControlNet Inpaint
- **사용 불가**: InstantID, PuLID, IP-Adapter FaceID (InsightFace 비상업 라이선스)

---

### 2-C. 이미지 편집 (`/image-edit`)

**목적**: 텍스트 프롬프트 + 다중 레퍼런스 이미지로 새 이미지 생성.

| 설정 항목 | 옵션 |
|---|---|
| AI 모델 | Seedream 5.0 / GPT Image / Grok (xAI) / Flux Pro |
| 이미지 크기 | 1K / 2K / 4K |
| 비율 | AUTO / 21:9 / 16:9 / 3:2 / 4:3 / 1:1 / 3:4 / 2:3 / 9:16 |
| 커스텀 크기 | 1~4096px (가로/세로 직접 입력) |
| 스케일 | -2 ~ +2 (×0.25 ~ ×4) |
| 생성 수량 | 1~4장 |
| 레퍼런스 이미지 | 최대 14장, 드래그 정렬 가능 |
| 크레딧 | 75 (1K/2K) / 150 (4K) |

**주요 유즈케이스**:
1. **레퍼런스 합성** — "figure 1 모델에 figure 2 선글라스 착용"
2. **제품 컨셉 촬영** — "물 스플래시 + 아크릴 배경, 8K 제품 촬영"
3. **연출 수정** — "배경을 카페 인테리어로 변경"

**UI 레이아웃**: 사이드바(샘플 6개) + 입력 패널(프롬프트+이미지) + 결과 패널 + 히스토리 패널.

**AI 전략**: 유저가 직접 모델을 선택하는 유일한 기능.
- **Seedream 5.0** (기본값) — 고품질 실사, ~$0.03/장
- **GPT Image 1.5** (프리미엄) — 프롬프트 이해력 최고, $0.02~0.25/장
- **Grok Imagine** — 가성비, $0.02/장
- **Flux Pro 1.1** — 아트 디렉션 자유도, $0.04/장

---

### 2-D. 업스케일 (예정)

**목적**: 저해상도 이미지를 AI로 고해상도(2x~16x)로 변환.

**현재 상태**: 랜딩 페이지에 섹션만 존재, 독립 페이지 미구현.

**AI 전략**:
- 기본: **Real-ESRGAN** via Replicate (~$0.003/장)
- 프리미엄: **Magnific AI** via Freepik API (~$0.10+/장)

---

## 3. 크레딧 & 과금

### 크레딧 소모
| 기능 | 소모량 |
|---|---|
| 리터칭 1회 | 80 크레딧 |
| 얼굴 편집 1회 | 85 크레딧 |
| 이미지 편집 (1K/2K) | 75 크레딧 |
| 이미지 편집 (4K) | 150 크레딧 |

### 월간 구독 플랜
| 플랜 | 가격 | 크레딧 | 비고 |
|---|---|---|---|
| Free | $0 | 200 | 속도 제한, 1장씩만 |
| Basic | $9 | 4,500 | |
| Deluxe | $19 | 9,500 | 추천 |
| Premium | $29 | 14,500 | 베타 기능 포함 |

### 일회성 충전
| 플랜 | 가격 | 크레딧 |
|---|---|---|
| Starter | $5 | 2,000 |
| Basic | $15 | 7,000 |
| Pro | $29 | 15,000 (추천) |
| Enterprise | $49 | 30,000 |

**결제 연동**: 미구현 (Stripe 또는 Toss Payments 예정)

---

## 4. 기술 스택

| 영역 | 기술 |
|---|---|
| **프레임워크** | Next.js 15 (App Router, RSC) |
| **언어** | TypeScript 5 (strict mode) |
| **UI** | React 18 |
| **스타일** | Tailwind CSS 3 + CSS Variables |
| **애니메이션** | Framer Motion 12 |
| **아이콘** | Lucide React |
| **클래스 결합** | clsx + tailwind-merge → `cn()` |
| **유효성 검증** | Zod 4 |
| **DB / Auth / Storage** | Supabase (PostgreSQL + Auth + Storage) |
| **AI** | 다중 Provider (Replicate, Stability AI, Fal.ai, OpenAI, xAI 등) |
| **패키지 매니저** | Yarn (v1 classic) |
| **상태관리** | React hooks + Context API (외부 라이브러리 없음) |
| **테스트** | Playwright 1.58 (dev) |
| **배포** | Vercel (GitHub main 자동 배포) |

---

## 5. 프로젝트 구조

```
/
├── app/                              # Next.js App Router
│   ├── auth/callback/route.ts        # OAuth PKCE 콜백
│   ├── data-deletion/page.tsx        # 데이터 삭제 정책
│   ├── face-edit/page.tsx            # 얼굴 편집 도구
│   ├── image-edit/page.tsx           # 이미지 편집 도구
│   ├── pricing/page.tsx              # 가격 페이지
│   ├── privacy/page.tsx              # 개인정보 처리방침
│   ├── retouching/page.tsx           # 리터칭 도구
│   ├── terms/page.tsx                # 이용약관
│   ├── globals.css                   # 전역 스타일 + CSS 변수 (디자인 시스템)
│   ├── layout.tsx                    # 루트 레이아웃 (폰트, Navigation, Toast)
│   └── page.tsx                      # 랜딩 페이지
│
├── components/
│   ├── sections/                     # 페이지 섹션 컴포넌트
│   │   ├── face-edit/                # 얼굴 편집 패널 5개
│   │   ├── image-edit/               # 이미지 편집 패널 5개
│   │   ├── retouching/              # 리터칭 패널 4개
│   │   ├── pricing/                  # 가격 서브컴포넌트 4개
│   │   ├── legal/                    # 법률 페이지 레이아웃
│   │   ├── hero.tsx                  # 히어로 (Before/After 슬라이더)
│   │   ├── skin-retouch.tsx          # 스킨 리터칭 소개
│   │   ├── skin-realism.tsx          # 리얼리즘 기술 소개
│   │   ├── image-edit.tsx            # 이미지 편집 소개
│   │   ├── face-swap.tsx             # 얼굴 교체 소개
│   │   ├── upscale.tsx               # 업스케일 소개
│   │   ├── pricing.tsx               # 가격 미리보기
│   │   ├── navigation.tsx            # 글로벌 네비게이션 (인증+스크롤바)
│   │   └── footer.tsx                # 푸터
│   │
│   └── ui/                           # 재사용 UI 컴포넌트
│       ├── button.tsx                # 5 variants, Framer Motion
│       ├── card.tsx                  # Glassmorphism
│       ├── modal.tsx                 # 기본 모달
│       ├── confirm-modal.tsx         # 확인 다이얼로그
│       ├── login-modal.tsx           # 인증 모달 (이메일+OAuth)
│       ├── toast.tsx                 # 토스트 알림 (Context+Portal)
│       ├── dropdown.tsx              # 드롭다운 (gradient variant 포함)
│       ├── slider.tsx                # Before/After 비교 슬라이더
│       ├── section-wrapper.tsx       # 애니메이션 섹션 래퍼
│       ├── tab-group.tsx             # 탭 네비게이션
│       ├── badge.tsx, input.tsx, select.tsx, textarea.tsx, tooltip.tsx
│       └── theme-toggle.tsx          # 다크/라이트 토글
│
├── hooks/
│   ├── use-slider.ts                 # Before/After 슬라이더 (mouse+touch)
│   ├── use-count-up.ts               # 숫자 카운트업 (IntersectionObserver)
│   └── use-mask-canvas.ts            # 마스크 캔버스 (draw/erase/rect, undo/redo)
│
├── lib/
│   ├── constants/
│   │   └── samples.ts                # 샘플 이미지 데이터
│   ├── errors/
│   │   └── index.ts                  # AppError → ApiError, AuthError, CreditError, ValidationError
│   ├── services/ai/
│   │   ├── providers/
│   │   │   ├── replicate.ts          # ReplicateProvider (stub)
│   │   │   └── stability.ts         # StabilityProvider (stub)
│   │   ├── registry.ts              # Provider 팩토리 + 캐시 (싱글턴)
│   │   └── types.ts                  # AI 타입 re-export
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저 클라이언트
│   │   ├── server.ts                 # 서버 컴포넌트 클라이언트
│   │   ├── admin.ts                  # 서비스 롤 클라이언트 (RLS 우회)
│   │   └── middleware.ts            # withAuth() HOF (API 라우트 보호)
│   ├── types/
│   │   ├── ai.ts                     # AIProvider, ModelConfig, GenerationInput/Result
│   │   ├── api.ts                    # ApiResponse<T>, ApiErrorResponse, PaginatedResponse<T>
│   │   └── database.ts              # Supabase 테이블 타입 (db-model이 자동 생성)
│   ├── validations/                  # Zod 스키마 (api-builder가 생성)
│   ├── animations.ts                # Framer Motion 프리셋 6종
│   └── utils.ts                      # cn() 유틸리티
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_users_and_credits.sql
│   │   └── 002_add_user_updated_trigger.sql
│   └── templates/
│       └── confirm-email.html        # 이메일 인증 템플릿
│
├── middleware.ts                     # Next.js 미들웨어 (세션 갱신)
├── tailwind.config.ts                # Tailwind 커스텀 설정
├── next.config.ts
├── package.json
├── tsconfig.json
└── SERVICE_GUIDE.md                  # ← 이 문서
```

---

## 6. 데이터베이스 스키마

**Supabase Project ID**: `ltqzuqvjbiecbjdqgjge`

### 테이블

#### `users`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK, FK → auth.users) | Supabase Auth UID |
| `email` | TEXT | 이메일 |
| `name` | TEXT? | 표시명 |
| `avatar_url` | TEXT? | 프로필 이미지 URL |
| `auth_provider` | TEXT | 'email' / 'google' / 'facebook' |
| `created_at` | TIMESTAMPTZ | 가입일 |
| `updated_at` | TIMESTAMPTZ | 수정일 |

#### `user_credits`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users, UNIQUE) | 1:1 관계 |
| `balance` | INTEGER | 잔여 크레딧 (기본값: 0) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### 트리거
1. **`handle_new_user()`** — `auth.users` INSERT 시 → `users` + `user_credits` 행 자동 생성
2. **`handle_user_updated()`** — `auth.users` UPDATE (메타데이터) 시 → `users` 프로필 동기화

### RLS 정책
- `users`: 본인 행만 SELECT / UPDATE
- `user_credits`: 본인 크레딧만 SELECT

### 미구현 테이블 (향후 필요)
- `generations` — 생성 이력 (이미지 URL, 프롬프트, 모델, 소모 크레딧)
- `credit_transactions` — 크레딧 충전/소모 로그
- `subscriptions` — 구독 상태 관리

---

## 7. 인증 시스템

### 지원 방식
- **이메일/비밀번호** — 가입 시 이메일 인증 필요
- **Google OAuth**
- **Facebook OAuth**

### 흐름
1. `login-modal.tsx`에서 로그인/회원가입 UI 제공
2. OAuth는 PKCE 방식 → `/auth/callback` 에서 code exchange
3. `middleware.ts`가 매 요청마다 세션 갱신
4. 유효하지 않은 세션 + auth 쿠키 존재 → 자동 로그아웃
5. `Navigation` 컴포넌트에서 `onAuthStateChange()` 구독

### Supabase 클라이언트 4종
| 클라이언트 | 파일 | 용도 |
|---|---|---|
| Browser | `lib/supabase/client.ts` | 클라이언트 컴포넌트에서 사용 |
| Server | `lib/supabase/server.ts` | 서버 컴포넌트 / API 라우트 |
| Admin | `lib/supabase/admin.ts` | 서비스 롤 (RLS 우회, 관리자 작업) |
| Middleware | `lib/supabase/middleware.ts` | `withAuth()` HOF로 API 라우트 보호 |

---

## 8. AI Provider 아키텍처

### 설계 패턴: Provider Registry (팩토리 + 싱글턴 캐시)

```
lib/services/ai/
├── providers/
│   ├── replicate.ts       ← AIProvider 구현체
│   └── stability.ts       ← AIProvider 구현체
├── registry.ts            ← getProvider(name), resolveProvider(model)
└── types.ts               ← 타입 re-export
```

### 핵심 인터페이스

```typescript
interface AIProvider {
  readonly name: AIProviderName;           // "replicate" | "stability"
  generate(model: ModelConfig, input: GenerationInput): Promise<GenerationResult>;
  getStatus(predictionId: string): Promise<"pending" | "processing" | "succeeded" | "failed">;
}

interface GenerationInput {
  image?: string;          // base64 또는 URL
  prompt?: string;
  negativePrompt?: string;
  params?: Record<string, unknown>;
}

interface GenerationResult {
  outputUrl: string;
  provider: AIProviderName;
  modelId: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}
```

### 현재 상태
- 두 Provider 모두 **stub** (501 에러 throw)
- API 라우트 미구현 (`app/api/` 디렉토리 없음)
- 실제 AI 호출 로직 개발 필요

### 확장 계획
Provider 추가 시 `AIProvider` 인터페이스 구현 후 `registry.ts`에 등록:
- `FalProvider` — Fal.ai (얼굴 편집)
- `OpenAIProvider` — GPT Image (이미지 편집)
- `XAIProvider` — Grok Imagine (이미지 편집)

---

## 9. 에러 처리

### 에러 클래스 계층

```
AppError (base)
├── ApiError         → code: "API_ERROR",        statusCode: 500
├── AuthError        → code: "AUTH_ERROR",        statusCode: 401
├── CreditError      → code: "CREDIT_ERROR",      statusCode: 402  (required, available 포함)
└── ValidationError  → code: "VALIDATION_ERROR",  statusCode: 400  (fields 포함)
```

### API 에러 응답 형태

```json
{
  "success": false,
  "error": {
    "code": "CREDIT_ERROR",
    "message": "크레딧이 부족합니다",
    "fields": null
  }
}
```

---

## 10. 디자인 시스템

### 두 가지 테마

PHOS는 **랜딩 테마**(마케팅 페이지)와 **에디터 테마**(도구 페이지)를 구분합니다.

#### 랜딩 테마 (기본 다크모드)
| 요소 | 값 |
|---|---|
| 배경 | `#090A14` |
| 카드 | `#10112A` |
| 프라이머리 | `#6366F1` (Indigo) |
| 세컨더리 | `#06B6D4` (Cyan) |
| 보더 | `rgba(99,102,241,0.10)` (인디고 틴트) |
| 이펙트 | Glassmorphism, Indigo glow, gradient text |
| 제목 폰트 | Space Grotesk |
| 본문 폰트 | Pretendard Variable |

#### 에디터 테마 (`.editor-theme` 클래스)
| 요소 | 값 |
|---|---|
| 배경 | `#141414` (뉴트럴 블랙) |
| 카드 | `#1e1e26` |
| 뮤트 | `#2e2e38` |
| 보더 | `rgba(255,255,255,0.08)` (인디고 틴트 제거) |
| 텍스트 | `#e8e8e8` / `#999999` |
| 적용처 | `/retouching`, `/face-edit`, `/image-edit` |

#### 적용 방법
- 랜딩: `<html className="dark">` (기본)
- 에디터: 페이지 래퍼에 `editor-theme` 클래스 추가
- CSS 변수가 `.dark .editor-theme` 블록에서 오버라이드됨

### 커스텀 CSS 클래스
| 클래스 | 용도 |
|---|---|
| `.glass-nav` | 네비게이션 바 (backdrop-filter) |
| `.glass-card` | Glassmorphism 카드 |
| `.glass-surface` | 반투명 서피스 |
| `.gradient-text` | 인디고→퍼플 그라디언트 텍스트 |
| `.hero-gradient` | 히어로 라디얼 그라디언트 오버레이 |
| `.btn-glow` | 인디고 글로우 버튼 |
| `.pricing-recommended` | 추천 가격 카드 하이라이트 |

### 애니메이션 프리셋 (`lib/animations.ts`)
| 이름 | 동작 |
|---|---|
| `fadeInUp` | 아래에서 위로 페이드인 (y:20→0) |
| `fadeIn` | 단순 페이드인 |
| `scaleIn` | 약간 작은 상태에서 확대 (0.95→1) |
| `staggerContainer` | 자식 요소 순차 등장 (0.1s 간격) |
| `slideInLeft` | 왼쪽에서 슬라이드 (x:-30→0) |
| `slideInRight` | 오른쪽에서 슬라이드 (x:30→0) |

### Tailwind 커스텀 확장
- **폰트 크기**: `hero` (3.5rem), `h2` (2.5rem), `h3`, `h4`, `subtitle`
- **그림자**: `glow-indigo`, `card-dark`, `card-hover-dark`, `elevated`
- **애니메이션**: `fade-in`, `slide-up`, `pulse-glow`
- **다크모드**: class 기반 (`darkMode: "class"`)

---

## 11. 페이지 아키텍처 패턴

### 랜딩 페이지 (`/`, `/pricing`)
- `SectionWrapper`로 각 섹션 래핑 → 스크롤 시 `fadeInUp` 자동 적용
- `use-slider` 훅으로 Before/After 비교 슬라이더
- `use-count-up` 훅으로 통계 숫자 카운트업 (IntersectionObserver)
- Server Component 기반

### 도구 페이지 (`/retouching`, `/face-edit`, `/image-edit`)
- 페이지 래퍼에 `editor-theme` 클래스
- 3패널 반응형 그리드: 입력 | 결과 | 히스토리
- 모바일: 탭 기반 전환 (`*-mobile-tabs.tsx`)
- Client Component (`"use client"`)
- 로컬 state + refs로 상태 관리

### 법률 페이지 (`/terms`, `/privacy`, `/data-deletion`)
- `LegalPageLayout` 공통 래퍼
- 정적 콘텐츠, Server Component

---

## 12. 코딩 컨벤션

### 파일 네이밍
| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일 | kebab-case | `face-edit-mask-editor.tsx` |
| 컴포넌트 | PascalCase | `FaceEditMaskEditor` |
| 훅 | camelCase with `use-` | `use-mask-canvas.ts` |
| 마이그레이션 | snake_case with 번호 | `001_create_users_and_credits.sql` |

### 컴포넌트 패턴
- 섹션 → `SectionWrapper`로 래핑
- 애니메이션 → `lib/animations.ts` 프리셋 사용
- 클래스 결합 → `cn()` 유틸리티
- 서버/클라이언트 분리 → `"use client"` 명시

### 커밋 & 언어
- 커밋 메시지: **한국어**
- UI 텍스트: **한국어** 기본 (`<html lang="ko">`)
- 코드 주석: 한국어 또는 영어

### 새 페이지 생성 시
1. `app/{page-name}/page.tsx` 생성
2. `public/images/{page-name}/` 디렉토리 생성
3. 필요시 `components/sections/{page-name}/` 디렉토리 생성

---

## 13. 톤 & 보이스 가이드라인

| 원칙 | 설명 |
|---|---|
| **Professional & Direct** | 미사여구 없이 기능 중심의 담백하고 전문적인 어조 |
| **Modern & Hip** | 세련된 기술 중심 브랜딩, 오글거리는 표현 지양 |
| **Visual Identity** | 하이엔드 뷰티 광고 수준. 깨끗한 피부 톤, 선명한 디테일 |
| **Photorealistic** | 일러스트/애니 톤 절대 불가. 철저한 실사 지향 |

### 금지 표현
- "혁신적인", "놀라운", "마법 같은" 등 과장 수식어
- 이모지 남발
- 비격식적 말투 ("짱", "대박")

### 권장 표현
- "상업용 퀄리티", "에디토리얼 수준", "인쇄물 대응"
- 기능을 사실적으로 설명하는 직접적 문장
- 숫자/수치로 뒷받침 ("4K 해상도", "80크레딧/장")

---

## 14. 환경 변수

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=           # 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # 퍼블릭 anon 키
SUPABASE_SERVICE_ROLE_KEY=          # 서버 전용 서비스 롤 키
SUPABASE_ACCESS_TOKEN=              # MCP 도구용 액세스 토큰

# AI Providers (구현 시 필요)
REPLICATE_API_TOKEN=
STABILITY_API_KEY=
FAL_AI_API_KEY=
OPENAI_API_KEY=
XAI_API_KEY=

# 테스트
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
```

---

## 15. 현재 상태 & 로드맵

### 완료된 것
- [x] 랜딩 페이지 전체 (Hero, 기능 소개 6섹션, 프라이싱 미리보기, 푸터)
- [x] 리터칭 페이지 UI (3패널 레이아웃, 설정 옵션 전체)
- [x] 얼굴 편집 페이지 UI (마스크 에디터, 샘플 사이드바)
- [x] 이미지 편집 페이지 UI (프롬프트 입력, 다중 이미지 업로드, 모델 선택)
- [x] 가격 페이지 (월간/일회성 탭, FAQ)
- [x] 인증 시스템 (이메일 + Google + Facebook OAuth)
- [x] DB 스키마 (users, user_credits)
- [x] 디자인 시스템 (랜딩 테마 + 에디터 테마)
- [x] 에러 처리 체계
- [x] AI Provider 아키텍처 (인터페이스 + 레지스트리)
- [x] 반응형 모바일 대응

### 미구현 (다음 단계)
- [ ] AI Provider 실제 구현 (Replicate, Fal.ai, OpenAI, xAI 연동)
- [ ] API 라우트 (`/api/generate/retouching`, `/api/generate/face-edit`, `/api/generate/image-edit`)
- [ ] 프롬프트 빌더 (모드/필터 → 시스템 프롬프트 조합 로직)
- [ ] 크레딧 차감 로직
- [ ] 생성 이력 저장 (DB 테이블 + Storage)
- [ ] 결제 연동 (Stripe 또는 Toss)
- [ ] 구독 관리
- [ ] 업스케일 독립 페이지
- [ ] 배치 처리 (일괄 보정)
- [ ] 샘플 이미지 교체 (글로벌 다양성 반영, 실제 AI 생성 결과물)
