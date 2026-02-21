# Revoa

Next.js + Tailwind CSS로 만든 프로젝트입니다.

## 시작하기

개발 서버 실행:

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: Yarn
- **Linting**: ESLint

## 프로젝트 구조

```
revoa/
├── app/              # Next.js App Router
│   ├── layout.tsx   # 루트 레이아웃
│   ├── page.tsx     # 홈 페이지
│   └── globals.css  # 전역 스타일 (Tailwind)
├── public/          # 정적 파일
└── ...config files  # 설정 파일들
```

## 주요 스크립트

- `yarn dev` - 개발 서버 시작
- `yarn build` - 프로덕션 빌드
- `yarn start` - 프로덕션 서버 시작
- `yarn lint` - ESLint 실행
