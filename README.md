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
- **Auth & DB**: Supabase (Auth + PostgreSQL + Storage)
- **Validation**: Zod 4
- **AI Providers**: Replicate, Stability AI (다중 Provider 추상화)
- **Infra**: Vercel (호스팅) + AWS Lambda (이미지 최적화)
- **Package Manager**: Yarn

## 프로젝트 구조

```
phos/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── image-edit/           # 이미지 에디터 API
│   ├── image-edit/               # 이미지 에디터 페이지
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 랜딩 페이지
├── components/
│   ├── sections/                 # 페이지 섹션 컴포넌트
│   │   ├── image-edit/           # 에디터 패널 (Input, Result, History, Sidebar)
│   │   └── navigation.tsx        # GNB
│   └── ui/                       # 재사용 UI 컴포넌트
├── lib/
│   ├── services/
│   │   ├── ai/                   # AI Provider 추상화 (registry, providers, models, prompts)
│   │   └── credits/              # 크레딧 서비스 (차감, 환불, 쿨다운)
│   ├── supabase/                 # Supabase 클라이언트 (client, server, admin, middleware)
│   ├── errors/                   # 에러 클래스 (ApiError, CreditError 등)
│   ├── types/                    # 타입 정의 (api, database, credits, ai)
│   ├── constants/                # 상수 (샘플 데이터 등)
│   ├── animations.ts             # Framer Motion 프리셋
│   └── utils.ts                  # cn() 유틸리티
├── hooks/                        # 커스텀 훅
├── supabase/migrations/          # SQL 마이그레이션 파일
├── public/images/                # 정적 이미지 (샘플, 랜딩)
└── SERVICE_GUIDE.md              # 서비스 가이드 (톤, 비주얼, 타겟)
```

## 주요 스크립트

- `yarn dev` - 개발 서버 시작
- `yarn build` - 프로덕션 빌드
- `yarn start` - 프로덕션 서버 시작
- `yarn lint` - ESLint 실행

## 배포

GitHub → Vercel 자동 배포 (main 브랜치 push 시)
