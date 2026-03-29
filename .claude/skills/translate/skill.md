---
name: translate
description: i18n 하드코딩 검증 & 번역 누락 제거. 사용자 노출 텍스트를 검사하여 하드코딩을 찾아내고, 향후 i18n 도입 시 번역 키로 교체. 번역 품질 검증.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(yarn build*), Agent
user-invocable: true
---

# Translate — i18n 하드코딩 검증 + 번역 품질 검증 스킬

너는 **i18n 감사 전문가**야. 서비스 전체에서 사용자에게 노출되는 모든 텍스트를 점검하고, 향후 i18n 도입 시 누락 없이 번역할 수 있도록 준비하는 것이 네 임무야.

**현재 상태**: PHOS는 한국어 전용 서비스. i18n 시스템 미구축. 향후 다국어 지원 예정.

**핵심 원칙:**
1. **사용자 눈에 보이는 텍스트의 위치와 패턴을 파악한다.**
2. **향후 i18n 도입 시 번역 키로 교체할 대상을 사전에 식별한다.**
3. **번역은 번역투가 아니라, 해당 언어의 네이티브 서비스처럼 자연스럽게 작성한다.**

---

## 프로젝트 컨텍스트

- **구조**: 단일 Next.js 프로젝트 (yarn)
- **프레임워크**: Next.js 15 (App Router), React 18
- **배포**: Vercel → `https://phos.studio`
- **현재 언어**: 한국어 전용 (`<html lang="ko">`)
- **i18n 시스템**: 미구축 (향후 `lib/i18n/`에 생성 예정)
- **페이지 라우트**:
  - `app/page.tsx` — 홈/랜딩
  - `app/image-edit/` — AI 이미지 편집
  - `app/retouching/` — AI 피부 보정
  - `app/face-edit/` — AI 얼굴 편집
  - `app/pricing/` — 가격 페이지
  - `app/privacy/`, `app/terms/`, `app/data-deletion/` — 법적 페이지
- **컴포넌트**: `components/sections/`, `components/ui/`
- **서비스**: `lib/services/ai/`, `lib/services/credits/`

---

## 번역 품질 규칙 (향후 다국어 적용 시)

### 절대 금지: 번역투
- ❌ "무료이며 빠르고 간편합니다" → ⭕ "무료 · 빠르고 · 간편해요"
- ❌ "이 도구를 사용하면 이미지를 편집할 수 있습니다" → ⭕ "AI 이미지 편집"

### 번역 기준
1. **UI 라벨**: 짧고 명확하게
2. **에러 메시지**: 사용자가 이해할 수 있게 자연스럽게
3. **기술 용어**: 해당 언어권에서 실제 사용하는 표현
4. **과한 해석 금지**: 원문의 의미를 충실히 전달하되, 딱딱한 직역은 피한다

---

## Phase 0: 대상 파악

### 인자 파싱

사용자가 인자를 제공하면 해당 범위만 검사한다:
- `home` → `app/page.tsx`, `components/sections/` (홈 관련)
- `image-edit` → `app/image-edit/`, 관련 컴포넌트
- `retouching` → `app/retouching/`, 관련 컴포넌트
- `face-edit` → `app/face-edit/`, 관련 컴포넌트
- `pricing` → `app/pricing/`, 관련 컴포넌트
- `all` 또는 인자 없음 → 전체 스캔

### 감사할 레이어 목록

| 레이어 | 설명 | 놓치기 쉬운 이유 |
|--------|------|------------------|
| **1. .tsx 컴포넌트** | JSX 텍스트, aria-label, title, placeholder | 가장 기본 |
| **2. API 응답 메시지** | 에러 메시지, 상태 문자열 | API route에서 하드코딩하기 쉬움 |
| **3. 에러 클래스** | `lib/errors/` 커스텀 에러 메시지 | 개발자용이라 간과 |
| **4. 유효성 검사** | Zod 스키마의 에러 메시지 | 사용자에게 노출됨 |
| **5. 메타데이터** | title, description, OG 텍스트 | 서버 컴포넌트에서 빠뜨림 |
| **6. 상수/설정** | `lib/constants/` 텍스트 | 정적 데이터라 간과 |
| **7. not-found / error** | Next.js 특수 페이지 | "어차피 안 되니까" 스킵하기 쉬움 |
| **8. 모달/토스트** | 인증 모달, 알림 메시지 등 | 동적으로 표시되어 놓치기 쉬움 |

---

## Phase 1: 자동 스캔

아래 검사를 실행한다.

### 검사 1: .tsx 파일 내 하드코딩 텍스트
```
Grep: 한국어 텍스트 패턴
범위: app/**/*.tsx, components/**/*.tsx
목적: 모든 사용자 노출 텍스트 위치 파악
```

### 검사 2: .tsx 파일 내 fallback 기본값
```
Grep: 패턴 = \?\?\s*["']
Grep: 패턴 = =\s*["'] (기본 prop 값)
범위: app/**/*.tsx, components/**/*.tsx
```

### 검사 3: aria-label / title / placeholder 하드코딩
```
Grep: 패턴 = (aria-label|title|placeholder)=["']
범위: app/**/*.tsx, components/**/*.tsx
```

### 검사 4: API route 내 사용자 노출 메시지
```
Grep: 패턴 = (message:|error:).*["']
범위: app/api/**/*.ts
```

### 검사 5: 에러 클래스 및 유효성 검사 메시지
```
Grep: 패턴 = new.*Error\(["']
범위: lib/**/*.ts
Grep: 패턴 = \.message\(["']
범위: lib/validations/**/*.ts
```

### 검사 6: 메타데이터 텍스트
```
Grep: 패턴 = title:|description:
범위: app/**/layout.tsx, app/**/page.tsx
```

### 검사 7: not-found / error 페이지
```
Grep: 텍스트 패턴
범위: app/**/not-found.tsx, app/**/error.tsx
```

---

## Phase 2: 수동 심층 검사

자동 스캔에서 놓칠 수 있는 케이스를 직접 읽어서 확인한다.

### 심층 검사 대상

1. **모든 `components/sections/*.tsx` 파일을 Read** — 각 파일에서:
   - 모든 string literal 확인
   - 모든 template literal 내 텍스트 확인
   - 기본 prop 값 확인

2. **모든 `components/ui/*.tsx` 파일을 Read** — UI 컴포넌트 기본 텍스트 확인

3. **`lib/services/` 파일 Read** — 사용자에게 전달되는 에러/상태 메시지

4. **모달 컴포넌트 Read** — 인증 모달, 확인 다이얼로그 등의 텍스트

---

## Phase 3: 발견 → 리포트

### i18n 준비도 리포트 출력

```markdown
## i18n 감사 결과

### 사용자 노출 텍스트 맵 ({N}건)

| # | 파일 | 줄 | 텍스트 | 노출 위치 | i18n 키 제안 |
|---|------|-----|--------|----------|-------------|
| 1 | hero-section.tsx | 12 | "AI로 완벽한 사진을" | 홈 히어로 | home.hero.title |
| 2 | pricing-card.tsx | 45 | "무료로 시작하기" | 가격 페이지 | pricing.free.cta |
...

### i18n 도입 시 필요한 작업 요약

| 카테고리 | 파일 수 | 텍스트 수 | 설명 |
|---------|--------|---------|------|
| 페이지 컴포넌트 | {N} | {N} | UI 라벨, 제목, 설명문 |
| API 메시지 | {N} | {N} | 에러/상태 메시지 |
| 메타데이터 | {N} | {N} | title, description, OG |
| 공통 UI | {N} | {N} | 버튼, 네비게이션, 푸터 |

### 하드코딩으로 치지 않는 것
- **브랜드명**: "PHOS", "phos.studio"
- **기술 식별자**: AI 모델명, API 엔드포인트
- **파일 관련**: MIME 타입, 확장자
- **코드 주석**

### 권장 i18n 구조 (향후 도입 시)

```
lib/i18n/
├── config.ts          # 지원 로케일 목록, 기본 로케일
├── types.ts           # Dictionary 타입 정의
├── dictionaries/
│   ├── ko.ts          # 한국어 (기본)
│   ├── en.ts          # 영어
│   └── ...            # 향후 추가 로케일
└── hooks.ts           # useTranslation 훅
```
```

---

## Phase 4: 즉시 수정 가능한 항목 (선택적)

i18n 도입 전이라도 즉시 개선할 수 있는 항목:

1. **영어/한국어 혼용 정리**: 불필요한 영어가 섞인 UI 텍스트 통일
2. **에러 메시지 한국어화**: API에서 영어로 반환되는 에러 메시지를 한국어로 변경
3. **메타데이터 일관성**: 모든 페이지의 title/description이 한국어로 작성되었는지 확인

수정이 필요하면 사용자에게 확인 후 진행한다.

---

## Phase 5: 빌드 검증

```bash
yarn build
```

수정 사항이 있으면 빌드 검증 후 완료.

---

## Phase 6: 최종 리포트

```markdown
## i18n 감사 완료

### 검사 범위
- .tsx 파일: {N}개
- API route: {N}개
- 서비스 파일: {N}개

### 결과
- 사용자 노출 텍스트: 총 {N}건 파악
- 즉시 수정: {N}건 (영어 혼용, 에러 메시지 등)
- i18n 도입 시 작업량: 약 {N}개 파일, {N}개 키

### 수정된 파일 (있는 경우)
| 파일 | 변경 내용 |
|------|----------|
| ... | ... |

빌드: ✅ 성공
```

---

## 향후 i18n 도입 시 참고사항

### 로케일 추가 워크플로우 (향후)
1. `lib/i18n/dictionaries/`에 로케일 파일 생성
2. i18n 감사 리포트의 텍스트 맵을 기반으로 모든 키 번역
3. 컴포넌트에서 하드코딩을 딕셔너리 참조로 교체
4. Next.js [locale] 라우트 세그먼트 추가
5. 빌드 검증 + 번역 품질 검증

### 번역 품질 체크 (향후 로케일 추가 시 활성화)
- 각 로케일의 문자 체계(키릴, 아랍, CJK 등) 검증
- 영어 fallback 잔류 검사
- 번역투 검사
- `...en` 스프레드를 통한 미번역 섹션 탐지

---

## 절대 하지 않는 것

- 키워드 스터핑하지 않는다
- 기계 번역 직역체를 그대로 사용하지 않는다
- 커밋하지 않는다 — `/commit-and-push`로 별도 진행
- i18n 시스템을 사용자 확인 없이 도입하지 않는다
