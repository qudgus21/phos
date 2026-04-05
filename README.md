# PHOS (포스)

AI 기반 하이엔드 실사 이미지 보정 및 컨셉 생성 SaaS

## 시작하기

```bash
yarn install
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript 5
- **Styling**: Tailwind CSS 3 + Framer Motion 12
- **Icons**: Lucide React
- **Auth & DB**: Supabase (Auth + PostgreSQL + Storage + Realtime)
- **Payment**: Polar SDK (MoR — 구독, 크레딧 팩, 웹훅, 고객 포털)
- **Server State**: TanStack Query (React Query) v5
- **Validation**: Zod 4
- **AI Providers**: Replicate, BytePlus Ark (다중 Provider 추상화)
- **i18n**: 한국어 + 영어
- **Infra**: Vercel (호스팅)
- **Package Manager**: Yarn

## 프로젝트 구조

```
phos/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── checkout/             # Polar 체크아웃 (구독/크레딧팩)
│   │   ├── webhook/polar/        # Polar 웹훅 핸들러
│   │   ├── portal/               # Polar 고객 포털
│   │   ├── credits/balance/      # 크레딧 잔액 조회
│   │   ├── image-edit/generate/  # 이미지 편집 생성
│   │   ├── retouching/generate/  # 스킨 리터칭 생성
│   │   ├── face-edit/generate/   # 얼굴 편집 생성
│   │   └── admin/                # 관리자 (유저, reconcile)
│   ├── retouching/               # 스킨 리터칭 도구
│   ├── face-edit/                # 얼굴 편집 도구
│   ├── image-edit/               # 이미지 편집 도구
│   ├── pricing/                  # 가격 페이지
│   └── page.tsx                  # 랜딩 페이지
├── components/
│   ├── sections/                 # 페이지 섹션 컴포넌트
│   └── ui/                       # 재사용 UI 컴포넌트
├── hooks/                        # 커스텀 훅 (credits, credits-realtime, history, favorites 등)
├── lib/
│   ├── services/ai/              # AI Provider 추상화 (registry, providers, models, prompts)
│   ├── services/credits/         # 크레딧 서비스 (차감, 환불, 쿨다운)
│   ├── supabase/                 # Supabase 클라이언트 (client, server, admin, middleware)
│   ├── constants/polar.ts        # Polar 상품 ID 매핑
│   ├── polar.ts                  # Polar SDK 클라이언트
│   └── types/                    # 타입 정의
├── supabase/migrations/          # SQL 마이그레이션 (27개+)
├── docs/                         # 문서 (결제 시스템 등)
├── public/images/                # 정적 이미지
└── SERVICE_GUIDE.md              # 서비스 가이드 (전체 맥락)
```

## 주요 스크립트

- `yarn dev` - 개발 서버 시작
- `yarn build` - 프로덕션 빌드
- `yarn start` - 프로덕션 서버 시작
- `yarn lint` - ESLint 실행

## 배포

GitHub → Vercel 자동 배포 (main 브랜치 push 시)
