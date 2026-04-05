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
| 얼굴 리쉐이프 | ON/OFF 토글 |
| 성별 | 여성 / 남성 |
| 보정 제외 영역 | 입술 / 눈썹 / 코 / 헤어 / 배경 / 의상 (체크박스) |
| 이미지 크기/비율 | 사이즈 + 비율 + 스케일 선택 |
| 크레딧 | 80 / 생성 |

**UI 레이아웃**: 6컴포넌트 (사이드바 | 입력 | 결과 | 히스토리 | 즐겨찾기 모달 | 모바일 탭).

**AI 전략**: 유저에게 모델 선택을 노출하지 않음. 내부적으로 모드/필터에 따라 프롬프트 분기.
- 엔진: **Flux Pro 1.1** (img2img) via Replicate
- 프롬프트 빌더: `lib/services/ai/prompts/skin-retouch.ts`

**API**: `POST /api/retouching/generate` — 인증 필수, 크레딧 선차감, 실패 시 환불

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

**UI 레이아웃**: 6컴포넌트 (사이드바 | 입력+마스크에디터 | 결과 | 즐겨찾기 모달 | 모바일 탭).

**AI 전략**:
- 엔진: **FLUX Fill Pro** via Replicate (마스크 기반 인페인팅)
- 프롬프트 빌더: `lib/services/ai/prompts/face-edit.ts`, `face-change.ts`

**API**: `POST /api/face-edit/generate` — 인증 필수, 크레딧 선차감, 실패 시 환불

---

### 2-C. 이미지 편집 (`/image-edit`)

**목적**: 텍스트 프롬프트 + 다중 레퍼런스 이미지로 새 이미지 생성.

| 설정 항목 | 옵션 |
|---|---|
| AI 모델 | Nano Banana Pro / SeedDream 5.0 / 기타 Replicate 모델 |
| 이미지 크기 | 1K / 2K / 3K / 4K / 커스텀 |
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

**UI 레이아웃**: 6컴포넌트 (사이드바 | 입력(프롬프트+이미지) | 결과 | 히스토리 | 즐겨찾기 모달 | 모바일 탭).

**AI 전략**: 유저가 직접 모델을 선택하는 유일한 기능.
- **Nano Banana Pro** (기본값) — 가성비 실사
- **SeedDream 5.0** — 고품질 실사, ~$0.03/장
- Provider: Replicate (폴링 기반 동기 생성)
- 프롬프트 빌더: `lib/services/ai/prompts/image-edit.ts`, `seedream.ts`

**API**: `POST /api/image-edit/generate` — 인증 필수, 크레딧 선차감, 실패 시 환불

---

### 2-D. 업스케일 (예정)

**목적**: 저해상도 이미지를 AI로 고해상도(2x~16x)로 변환.

**현재 상태**: 랜딩 페이지에 섹션 존재 + 업스케일러 서비스 코드 구현 완료, 독립 페이지 미구현.

**AI 전략**:
- 엔진: **Real-ESRGAN** via Replicate (~$0.003/장) — `lib/services/ai/upscaler.ts`에 구현 완료
- 429 에러 자동 재시도 + 지수 백오프 포함

---

## 3. 크레딧 & 과금

### 크레딧 소모
| 기능 | 소모량 |
|---|---|
| 리터칭 1회 | 80 크레딧 |
| 얼굴 편집 1회 | 85 크레딧 |
| 이미지 편집 (1K/2K) | 75 크레딧 |
| 이미지 편집 (4K) | 150 크레딧 |

### 크레딧 시스템 구현
- **선차감 패턴**: AI 생성 전 `deduct_credits` RPC로 원자적 차감 → ���패 시 `refundCredits`로 환불
- **이중 잔액**: `onetime_balance` + `subscription_balance` — onetime 우선 차감
- **Realtime UI**: Supabase Realtime으로 `user_credits`/`user_subscriptions` 변경 감지 → React Query 캐시 자동 갱신
- **쿨다운**: FREE: 300초, 유료 플랜(Basic/Pro/Premium): 0초
- **핵심 정책**: 결제한 크레딧은 절대 소멸/회수 금지 (취소·해지 시에도 잔액 유지)
- **RPC 함수**: `deduct_credits`, `add_credits`, `process_subscription_activation`, `process_credit_purchase`, `process_refund`, `process_subscription_revoke`
- **���비스**: `lib/services/credits/index.ts` — `getUserCreditInfo`, `deductCredits`, `refundCredits`, `checkCooldown`

### 월간 구독 플랜
| 플랜 | 가격 | 크레딧 | 비고 |
|---|---|---|---|
| Free | $0 | 120 | 속도 제한 (300초 쿨다운) |
| Basic | $9 | 2,000 | |
| Pro | $19 | 4,400 | 추천 |
| Premium | $29 | 7,100 | 베타 기능 포함 |

### 일회성 충전
| 가격 | 크레딧 |
|---|---|
| $5 | 700 |
| $10 | 1,500 |
| $15 | 2,400 |
| $20 | 3,300 |
| $30 | 5,100 |

### 결제 연동 (Polar)
- **결제 처리**: Polar (Merchant of Record) — 카드 결제, 구독 관리, 환불 처리
- **웹훅**: `POST /api/webhook/polar` — 서명 검증 + 멱등성(webhook_id) 보장
- **이벤트**: `order.paid`, `order.refunded`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`, `subscription.uncanceled`
- **고객 포털**: Polar 제공 페이지에서 결제 수단 변경, 취소 철회, 인보이스 확인
- **업그레이드**: 즉시 적용 (`prorationBehavior: "invoice"`), 남은 기간 비례 크레딧 재계산
- **다운그레이드**: 다음 결제일 적�� (`prorationBehavior: "next_period"`), `scheduled_plan_id`로 예약
- **더블클릭 방지**: 60초 TTL 캐시로 동일 상품 중복 요청 차단

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
| **DB / Auth / Storage** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **결제** | Polar SDK (`@polar-sh/sdk`) — MoR 방식 |
| **서버 상태** | TanStack Query (React Query) v5 |
| **AI** | 다중 Provider (Replicate, BytePlus Ark) |
| **패키지 매니저** | Yarn (v1 classic) |
| **상태관리** | React hooks + Context API |
| **테스트** | Playwright 1.58 (dev) |
| **배포** | Vercel (GitHub main 자동 배포) |

---

## 5. 프로젝트 구조

```
/
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── checkout/route.ts         # Polar 체크아웃 세션 생성 (구독/크레딧팩)
│   │   ├── webhook/polar/route.ts    # Polar 웹훅 (결제/환불/구독 이벤트)
│   │   ├── portal/route.ts           # Polar 고객 포털 세션
│   │   ├── credits/balance/route.ts  # 크레딧 잔액 조회
│   │   ├── history/route.ts          # 생성 이력 삭제
│   │   ├── image-edit/generate/route.ts   # 이미지 편집 생성
│   │   ├── retouching/generate/route.ts   # 스킨 리터칭 생성
│   │   ├── face-edit/generate/route.ts    # 얼굴 편집 생성
│   │   ├── admin/reconcile/route.ts  # Polar 동기화 (누락 웹훅 보정)
│   │   └── admin/users/route.ts      # 관리자 유저 관리
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
│   │   ├── face-edit/                # 얼굴 편집 패널 6개
│   │   ├── image-edit/               # 이미지 편집 패널 6개
│   │   ├── retouching/               # 리터칭 패널 6개
│   │   ├── pricing/                  # 가격 서브컴포넌트
│   │   ├── legal/                    # 법률 페이지 레이아웃
│   │   ├── hero.tsx                  # 히어로 (파티클 애니메이션)
│   │   ├── skin-retouch.tsx          # 스킨 리터칭 소개 (Before/After 캐러셀)
│   │   ├── skin-realism.tsx          # 리얼리즘 기술 소개 (마우스 트래킹 인터랙션)
│   │   ├── image-edit.tsx            # 이미지 편집 소개 (유즈케이스 갤러리)
│   │   ├── face-swap.tsx             # 얼굴 교체 소개 (Before/After 샘플)
│   │   ├── upscale.tsx               # 업스케일 소개 (인터랙티브 슬라이더)
│   │   ├── pricing.tsx               # 가격 미리보기
│   │   ├── navigation.tsx            # 글로벌 네비게이션 (인증+크레딧+스크롤)
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
│   ├── use-mask-canvas.ts            # 마스크 캔버스 (draw/erase/rect, undo/redo)
│   ├── use-credits.ts                # 크레딧 잔액·구독·쿨다운 조회 (React Query)
│   ├── use-credits-realtime.ts       # Supabase Realtime 구독 (credits + subscriptions 변경 감지)
│   ├── use-history.ts                # 생성 이력 조회/삭제 (React Query)
│   └── use-favorites.ts              # 즐겨찾기 저장/로드/삭제 (Supabase Storage)
│
├── lib/
│   ├── constants/
│   │   ├── polar.ts                  # Polar 상품 ID 매핑 (플랜, 크레딧팩)
│   │   ├── samples.ts                # 이미지 편집 샘플 데이터
│   │   └── retouching-samples.ts     # 리터칭 샘플 데이터
│   ├── errors/
│   │   └── index.ts                  # AppError → ApiError, AuthError, CreditError, ValidationError
│   ├── services/
│   │   ├── credits/
│   │   │   └── index.ts              # 크레딧 조회·차감·환불·쿨다운
│   │   └── ai/
│   │       ├── models.ts             # ModelDef, IMAGE_EDIT_MODELS 정의
│   │       ├── registry.ts           # Provider 팩토리 + 싱글턴 캐시
│   │       ├── types.ts              # AIProvider 인터페이스
│   │       ├── upscaler.ts           # Real-ESRGAN 업스케일러 (Replicate)
│   │       ├── replicate-files.ts    # Replicate 파일 업로드
│   │       ├── providers/
│   │       │   ├── replicate.ts      # ✅ Replicate Provider (Flux Pro, SeedDream 등)
│   │       │   ├── byteplus.ts       # ✅ BytePlus Ark Provider
│   │       │   └── stability.ts      # ❌ Stability Provider (stub)
│   │       └── prompts/
│   │           ├── index.ts          # 프롬프트 빌더 export
│   │           ├── image-edit.ts     # 이미지 편집 프롬프트
│   │           ├── seedream.ts       # SeedDream 프롬프트
│   │           ├── skin-retouch.ts   # 스킨 리터칭 프롬프트
│   │           ├── face-edit.ts      # 얼굴 편집 프롬프트
│   │           └── face-change.ts    # 얼굴 변경 프롬프트
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저 클라이언트
│   │   ├── server.ts                 # 서버 컴포넌트 클라이언트
│   │   ├── admin.ts                  # 서비스 롤 클라이언트 (RLS 우회)
│   │   └── middleware.ts             # withAuth(), withAdminAuth() HOF
│   ├── types/
│   │   ├── ai.ts                     # AIProvider, ModelConfig, GenerationInput/Result
│   │   ├── api.ts                    # ApiResponse<T>, ApiErrorResponse, PaginatedResponse<T>
│   │   ├── credits.ts                # UserCreditInfo, PlanInfo, DeductResult
│   │   └── database.ts              # Supabase 테이블 타입 (db-model이 자동 생성)
│   ├── validations/
│   │   └── image-generation.ts       # Zod 스키마 (모델, 프롬프트, 크기, 비율 등)
│   ├── utils/
│   │   └── compress-image.ts         # WebP 이미지 압축
│   ├── polar.ts                      # Polar SDK 클라이언트 팩토리
│   ├── query-keys.ts                 # React Query 키 팩토리
│   ├── animations.ts                 # Framer Motion 프리셋 6종
│   └── utils.ts                      # cn() 유틸리티
│
├── supabase/
│   ├── migrations/                   # 27개+ 마이그레이션
│   │   ├── 001~002 (users, credits, triggers)
│   │   ├── 003~004 (구독 플랜, 이중 잔액)
│   │   ├── 005~008 (크레딧 RPC, 관리자 역할, Free 120크레딧)
│   │   ├── 009~015 (히스토리, 즐겨찾기, WebP)
│   │   ├── 016~018 (플랜 정렬, i18n)
│   │   ├── 019~020 (Polar 연동: webhook_events, orders, credit_transactions, 결제 RPC)
│   │   ├── 021~024 (period_credits_granted, scheduled_plan_id, 크레딧 소멸 금지)
│   │   └── 025~027 (크레딧 누적, 해지 시 잔액 유지, 비례 업그레이드)
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
| `role` | TEXT | 'user' / 'admin' (기본: user) |
| `polar_customer_id` | TEXT | Polar 고객 ID |
| `created_at` | TIMESTAMPTZ | 가입일 |
| `updated_at` | TIMESTAMPTZ | 수정일 |

#### `user_credits`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users, UNIQUE) | 1:1 관계 |
| `balance` | INTEGER | 총 잔액 (subscription + onetime) |
| `onetime_balance` | INTEGER | 일회성 충전 크레딧 (우선 차감) |
| `subscription_balance` | INTEGER | 구독 크레딧 |
| `last_generation_at` | TIMESTAMPTZ | 쿨다운 추적용 |
| `period_credits_granted` | INTEGER | 이번 결제 주기에 부여된 크레딧 (업그레이드 비례 계산용) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `user_subscriptions`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `plan_id` | TEXT (FK → subscription_plans) | free / basic / pro / premium |
| `status` | TEXT | active / canceled / revoked |
| `external_subscription_id` | TEXT | Polar 구독 ID |
| `scheduled_plan_id` | TEXT | 다운그레이드 예약 플랜 (다음 결제일 적용) |
| `current_period_start` | TIMESTAMPTZ | 현재 구독 시작일 |
| `current_period_end` | TIMESTAMPTZ | 현재 구독 종료일 |

#### `subscription_plans`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | TEXT | Free / Basic / Pro / Premium |
| `credits` | INTEGER | 월간 크레딧 |
| `price` | INTEGER | 월간 가격 (센트) |
| `features` | JSONB | 기능 목록 (쿨다운, 배치 수 등) |
| `retention_days` | INTEGER | 데이터 보존 기간 |

#### `generation_history`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `feature_type` | TEXT | 'image-edit' / 'retouching' / 'face-edit' |
| `model_id` | TEXT | 사용된 모델 ID |
| `prompt` | TEXT (max 2000) | 입력 프롬프트 |
| `input_urls` | TEXT[] | 입력 이미지 URL 배열 |
| `output_urls` | TEXT[] | 생성 이미지 URL 배열 (WebP 포함) |
| `credits_used` | INTEGER | 소모된 크레딧 |
| `metadata` | JSONB | 기능별 추가 파라미터 |
| `created_at` | TIMESTAMPTZ | |

#### `favorites`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `feature_type` | TEXT | 기능 유형 |
| `metadata` | JSONB | 즐겨찾기 설정 + 이미지 정보 |
| `created_at` | TIMESTAMPTZ | |

#### `orders` (결제 주문)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | TEXT (PK) | Polar 주문 ID |
| `user_id` | UUID (FK → users) | |
| `polar_product_id` | TEXT | Polar 상품 ID |
| `product_type` | TEXT | 'subscription' / 'credit_pack' |
| `amount_cents` | INTEGER | 결제 금액 (센트) |
| `credits_granted` | INTEGER | 부여된 크레딧 |
| `status` | TEXT | 'paid' / 'refunded' / 'partially_refunded' |
| `metadata` | JSONB | 환불 추적 정보 |

#### `credit_transactions` (감사 로그)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | |
| `type` | ENUM | signup_bonus / subscription_grant / onetime_purchase / generation_deduct / refund / admin_adjust |
| `onetime_delta` | INTEGER | 일회성 잔액 변경량 |
| `subscription_delta` | INTEGER | 구독 잔액 변경�� |
| `balance_after_onetime` | INTEGER | 변경 후 스냅샷 |
| `balance_after_subscription` | INTEGER | 변경 후 스냅샷 |
| `description` | TEXT | 설명 |
| `metadata` | JSONB | 추가 컨텍스트 |

#### `webhook_events` (웹훅 멱등성)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | TEXT (PK) | Polar webhook-id 헤더 |
| `event_type` | TEXT | 이벤트 타입 |
| `payload` | JSONB | 이벤트 페이로드 |
| `processed_at` | TIMESTAMPTZ | 처리 시각 |

### 트리거
1. **`handle_new_user()`** — `auth.users` INSERT 시 → `users` + `user_credits` + Free 플랜 구독 자동 생성
2. **`handle_user_updated()`** — `auth.users` UPDATE (메타데이터) 시 → `users` 프로필 동기화

### RPC 함수
| 함수 | 용도 |
|---|---|
| `deduct_credits(p_user_id, p_amount)` | 원자적 크레딧 차감 (onetime 우선). 만료 체크 없음 (크레딧 영구 유지) |
| `add_credits(p_user_id, p_amount, p_type)` | 크레딧 추가 (환불, 관리자 조정) |
| `process_subscription_activation(...)` | 구독 활성화/갱신/업그레이드. 갱신: 기존 잔액 + 신규 누적. 업그레이드: 날짜 비례 계산 |
| `process_credit_purchase(...)` | 크레딧 팩 구매 처리. onetime_balance에 추가 |
| `process_refund(...)` | 환불 처리. 비례 크레딧 회수, shortfall 기록 |
| `process_subscription_revoke(...)` | 구독 해지. plan→free, 크레딧 잔액은 유지 (period_credits_granted만 리셋) |

### RLS 정책
- `users`: 본인 행만 SELECT / UPDATE
- `user_credits`: 본인 크레딧만 SELECT
- `generation_history`: 본인 이력만 SELECT, 서비스 롤만 INSERT
- `favorites`: 본인 즐겨찾기만 CRUD

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
| Middleware | `lib/supabase/middleware.ts` | `withAuth()`, `withAdminAuth()` HOF로 API 라우트 보호 |

---

## 8. AI Provider 아키텍처

### 설계 패턴: Provider Registry (팩토리 + 싱글턴 캐시)

```
lib/services/ai/
├── providers/
│   ├── replicate.ts       ← ✅ 구현 완료 (폴링 기반 동기 생성)
│   ├── byteplus.ts        ← ✅ 구현 완료 (BytePlus Ark API)
│   └── stability.ts       ← ❌ Stub (미구현)
├── prompts/
│   ├── image-edit.ts      ← 이미지 편집 프롬프트 빌더
│   ├── seedream.ts        ← SeedDream 전용 프롬프트 빌더
│   ├── skin-retouch.ts    ← 스킨 리터칭 프롬프트 빌더
│   ├── face-edit.ts       ← 얼굴 편집 프롬프트 빌더
│   └── face-change.ts     ← 얼굴 변경 프롬프트 빌더
├── models.ts              ← ModelDef, IMAGE_EDIT_MODELS
├── registry.ts            ← getProvider(name), resolveProvider(model)
├── upscaler.ts            ← Real-ESRGAN 업스케일러
├── replicate-files.ts     ← Replicate 파일 업로드 유틸리티
└── types.ts               ← 타입 re-export
```

### 핵심 인터페이스

```typescript
interface AIProvider {
  readonly name: AIProviderName;
  generate(model: ModelConfig, input: GenerationInput): Promise<GenerationResult>;
  getStatus(predictionId: string): Promise<"pending" | "processing" | "succeeded" | "failed">;
}
```

### 지원 모델
| 모델 | Provider | 용도 |
|---|---|---|
| Flux Pro 1.1 | Replicate | 리터칭, 이미지 편집 |
| FLUX Fill Pro | Replicate | 얼굴 편집 (마스크 인페인팅) |
| Nano Banana Pro | Replicate | 이미지 편집 (기본) |
| SeedDream 5.0 | Replicate | 이미지 편집 (고품질) |
| Real-ESRGAN | Replicate | 업스케일 |
| BytePlus Ark | BytePlus | 텍스트→이미지 (레퍼런스 지원) |

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
- 6컴포넌트 구성: 사이드바 | 입력 | 결과 | 히스토리 | 즐겨찾기 모달 | 모바일 탭
- 모바일: 탭 기반 전환 (`*-mobile-tabs.tsx`)
- Client Component (`"use client"`)
- 로컬 state + refs + React Query로 상태 관리
- 공통 훅: `use-credits`, `use-history`, `use-favorites`

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

# AI Providers
REPLICATE_API_TOKEN=                # ✅ Replicate (메인 Provider)
ARK_API_KEY=                        # BytePlus Ark

# Polar (결제)
POLAR_ACCESS_TOKEN=                 # Polar API 액세스 토큰
POLAR_WEBHOOK_SECRET=               # 웹훅 서명 검증 시크릿
POLAR_ORGANIZATION_ID=              # Polar 조직 ID
NEXT_PUBLIC_POLAR_PRODUCT_*=        # 각 플랜/크레딧팩의 Polar 상품 ID (env별 분리)

# 기타
UNSPLASH_ACCESS_KEY=                # 샘플 이미지 소스

# 기능 플래그
NEXT_PUBLIC_SKIP_IMAGE_OPTIMIZER=   # 이미지 최적화 스킵 (테스트용)
DRY_RUN=                            # API 드라이런 모드 (테스트용)
```

---

## 15. 현재 상태 & 로드맵

### 완료된 것
- [x] 랜딩 페이지 전체 (Hero, 기능 소개 6섹션, 프라이싱 미리보기, 푸터)
- [x] 리터칭 페이지 — UI + API + AI 생성 + 크레딧 차감 + 히스토리 + 즐겨찾기
- [x] 얼굴 편집 페이지 — UI + 마스크 에디터 + API + AI 생성 + 크레딧 차감 + 즐겨찾기
- [x] 이미지 편집 페이지 — UI + 다중 모델 선택 + API + AI 생성 + 크레딧 차감 + 히스토리 + 즐겨찾기
- [x] 가격 페이지 (월간/일회성 탭, FAQ)
- [x] 인증 시스템 (이메일 + Google + Facebook OAuth)
- [x] DB 스키마 (users, user_credits, user_subscriptions, subscription_plans, generation_history, favorites, orders, credit_transactions, webhook_events)
- [x] 크레딧 시스템 (선차감 → 환불 패턴, 이중 잔액, 쿨다운, RPC 함수 6종)
- [x] **결제 연동 (Polar)** — 체크아웃, 웹훅, 고객 포털, 환불, 업/다운그레이드, 멱등성
- [x] **구독 관리** — 업그레이드(즉시, 비례 크레딧), 다운그레이드(예약), 취소/해지(크레딧 유지)
- [x] AI Provider 구현 (Replicate + BytePlus, 프롬프트 빌더 5종)
- [x] API 라우트 10개+ (3개 생성 + 체크아웃 + 웹훅 + 포털 + 크레딧 + 히스토리 + 관리자 2개)
- [x] 생성 이력 시스템 (DB + 훅 + UI)
- [x] 즐겨찾기 시스템 (DB + Storage + 훅 + UI)
- [x] 업스케일러 서비스 코드 (Real-ESRGAN)
- [x] 이미지 압축 유틸리티 (WebP)
- [x] 디자인 시스템 (랜딩 테마 + 에디터 테마)
- [x] 에러 처리 체계
- [x] 반응형 모바일 대응
- [x] 관리자 API + Polar 동기화(reconcile)
- [x] i18n (한국어 + 영어)
- [x] Supabase Realtime 크레딧 실시간 반영
- [x] 성능 최적화 (Pretendard 서브셋팅, dynamic import, LCP 최적화)

### 미구현 (다음 단계)
- [ ] 업스케일 독립 페이지
- [ ] 배치 처리 (일괄 보정)
- [ ] Stability AI Provider 구현
