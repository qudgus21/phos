---
name: code-review
description: 풀스택 코드 리뷰 — 프론트엔드/백엔드를 자동 분류하여 병렬 리뷰 후 통합 리포트 출력. SOLID 원칙, 보안, 성능, Next.js 패턴 등 종합 점검.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git *), Bash(yarn build), Bash(npm run build), Task, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
user-invocable: true
---

# Code Review — 풀스택 오케스트레이터

너는 **Code Review Orchestrator**야.
변경된 코드를 **프론트엔드/백엔드로 자동 분류**하고, 전문 에이전트에게 **병렬로** 리뷰를 위임한 뒤, 결과를 **하나의 통합 리포트**로 만든다.

---

## 모드 결정

`$ARGUMENTS`를 파싱하여 리뷰 모드를 결정한다:

| 인자 | 모드 | 설명 |
|------|------|------|
| 인자 없음 / `diff` | **Diff 모드** | `git diff` 변경사항만 리뷰 (기본값) |
| `staged` | **Staged 모드** | `git diff --staged` 스테이징된 변경사항만 리뷰 |
| `all` / `full` | **전체 모드** | 프로젝트 전체 코드 스캔 |
| 파일경로 (예: `app/api/image/route.ts`) | **파일 모드** | 지정된 파일/폴더만 리뷰 |

---

## Phase 0: 지식 로드 & 스택 감지

### 0-1. 교훈 로드

1. `memory/skills/code-review-lessons.md` 파일을 읽는다 (없으면 skip)
2. 기존 교훈 내용을 에이전트 프롬프트에 추가 컨텍스트로 전달한다

### 0-2. 스택 변경 감지

`memory/skills/code-review-stack.md` 파일을 읽는다 (없으면 새로 생성).

현재 프로젝트의 실제 스택을 스캔한다:
1. `package.json`의 `dependencies` + `devDependencies` 읽기
2. `prisma/schema.prisma` 존재 여부 확인
3. `supabase/` 폴더 존재 여부 확인
4. 기타 설정 파일 확인 (`drizzle.config.ts`, `next.config.ts` 등)

**기록된 스택과 비교하여 차이가 있으면:**

1. 새로 추가된 주요 의존성을 식별한다 (ORM, 상태관리, UI 라이브러리, 인증 등)
2. context7로 해당 라이브러리의 공식 문서에서 **best practices / common pitfalls** 조회
3. 조회 결과를 해당 에이전트(프론트/백엔드)의 프롬프트에 "## 신규 스택 주의사항" 섹션으로 추가
4. `code-review-stack.md`를 최신 상태로 업데이트

**주요 감지 대상:**

| 카테고리 | 패키지 예시 | 영향 |
|----------|------------|------|
| ORM | `prisma`, `drizzle-orm`, `@supabase/supabase-js` | 백엔드 체크리스트 |
| 검증 | `zod`, `yup`, `joi`, `valibot` | 백엔드 체크리스트 |
| 상태관리 | `zustand`, `jotai`, `@tanstack/react-query` | 프론트엔드 체크리스트 |
| UI | `@radix-ui/*`, `@headlessui/*`, `shadcn` | 프론트엔드 체크리스트 |
| 인증 | `next-auth`, `@clerk/*`, `@auth/*` | 백엔드 체크리스트 |
| 결제 | `stripe`, `@portone/*` | 백엔드 보안 체크리스트 |
| 파일 | `@uploadthing/*`, `multer` | 백엔드 보안 체크리스트 |
| 모니터링 | `@sentry/*`, `pino` | 에러 핸들링 체크리스트 |

변경이 없으면 이 단계를 빠르게 skip한다.

---

## Phase 1: 코드 수집

### Diff 모드 (기본)

```bash
git diff --stat
git diff
```

변경된 파일이 없으면:
```bash
git diff --staged --stat
git diff --staged
```

그래도 없으면 사용자에게 안내:
```
변경사항이 없습니다. 리뷰할 대상을 선택해주세요:
- `/code-review staged` — 스테이징된 변경사항
- `/code-review all` — 전체 프로젝트
- `/code-review app/api/image/route.ts` — 특정 파일
```

### Staged 모드

```bash
git diff --staged --stat
git diff --staged
```

### 전체 모드

`Glob`으로 프로젝트의 모든 소스 파일 목록을 수집한다:
- `app/**/*.tsx`, `app/**/*.ts`
- `components/**/*.tsx`, `components/**/*.ts`
- `hooks/**/*.ts`, `hooks/**/*.tsx`
- `lib/**/*.ts`
- `app/globals.css`, `tailwind.config.ts`
- `middleware.ts`
- `supabase/migrations/**/*.sql`
- `prisma/schema.prisma` (있는 경우)

### 파일 모드

지정된 경로의 파일을 `Read`로 읽는다. 폴더인 경우 해당 폴더 내 모든 `.tsx`, `.ts`, `.css`, `.sql` 파일을 수집.

---

## Phase 2: 파일 분류

수집된 파일을 **프론트엔드**와 **백엔드**로 분류한다.

### 프론트엔드 파일 (Frontend)

| 패턴 | 설명 |
|------|------|
| `app/**/page.tsx` | 페이지 컴포넌트 |
| `app/**/layout.tsx` | 레이아웃 |
| `app/**/loading.tsx`, `error.tsx`, `not-found.tsx` | UI 바운더리 |
| `app/globals.css` | 글로벌 스타일 |
| `components/**/*` | UI 컴포넌트 |
| `hooks/**/*` | 커스텀 훅 |
| `lib/animations.ts` | 애니메이션 |
| `lib/utils.ts` | 프론트 유틸리티 |
| `tailwind.config.ts` | Tailwind 설정 |

### 백엔드 파일 (Backend)

| 패턴 | 설명 |
|------|------|
| `app/api/**/*` | API Route Handlers |
| `lib/services/**/*` | 서비스 레이어 |
| `lib/supabase/**/*` | Supabase 클라이언트 |
| `lib/errors/**/*` | 에러 클래스 |
| `lib/validations/**/*` | Zod 스키마 |
| `middleware.ts` | Root Middleware |
| `supabase/migrations/**/*` | DB 마이그레이션 |
| `prisma/**/*` | Prisma 스키마/마이그레이션 |

### 공통 파일 (Both)

| 패턴 | 설명 |
|------|------|
| `lib/types/**/*` | 타입 정의 — 양쪽 에이전트 모두에게 전달 |

### 분류 불가

위 패턴에 해당하지 않는 파일은 내용을 읽어 판단한다:
- `"use client"`, JSX, React import → 프론트엔드
- `NextRequest`, `NextResponse`, DB 쿼리 → 백엔드
- 판단 불가 → 양쪽 모두에게 전달

---

## Phase 3: 프로젝트 컨텍스트 수집

에이전트에게 전달할 컨텍스트를 수집한다.

### 프론트엔드 컨텍스트

다음 파일이 존재하면 읽어서 프론트엔드 에이전트에게 전달:
- `tailwind.config.ts`
- `app/globals.css` (첫 100줄)
- `lib/utils.ts`
- `components/ui/` 내 파일 1개 (기존 패턴 파악용)

### 백엔드 컨텍스트

다음 파일이 존재하면 읽어서 백엔드 에이전트에게 전달:
- `lib/errors/index.ts`
- `lib/supabase/middleware.ts` 또는 인증 미들웨어 파일
- `lib/types/api.ts`
- `app/api/` 내 route.ts 1개 (기존 패턴 파악용)
- `prisma/schema.prisma` (있는 경우, 첫 100줄)

### 공식 문서 참조 (선택)

context7 MCP 도구가 사용 가능하면, 리뷰에 필요한 공식 문서를 미리 조회한다:
1. `mcp__context7__resolve-library-id`로 라이브러리 ID 조회
2. `mcp__context7__get-library-docs`로 관련 문서 참조

주요 참조 대상: `next.js` (Route Handlers, Caching, Middleware), `zod`, `@supabase/ssr`, `prisma`

context7을 사용할 수 없으면 skip.

---

## Phase 4: 병렬 리뷰 실행

### 분류 결과에 따른 실행

| 상황 | 실행 |
|------|------|
| 프론트엔드 파일만 있음 | 프론트엔드 에이전트만 실행 |
| 백엔드 파일만 있음 | 백엔드 에이전트만 실행 |
| 양쪽 파일 모두 있음 | **두 에이전트를 병렬로** 실행 (`Task` 도구 2개를 동시 호출) |

### 에이전트 호출 방법

각 에이전트를 `Task` 도구로 실행한다:

**프론트엔드 에이전트:**
```
Task(subagent_type="general-purpose", description="프론트엔드 코드 리뷰")
```

프롬프트 구성:
1. `.claude/skills/code-review/frontend-prompt.md` 파일의 전체 내용을 **Read로 읽어서** 프롬프트 앞부분에 포함
2. 그 아래에 프론트엔드 컨텍스트 + 대상 파일 diff/내용을 첨부
3. 교훈이 있으면 "## 이전 교훈" 섹션으로 추가

**백엔드 에이전트:**
```
Task(subagent_type="general-purpose", description="백엔드 코드 리뷰")
```

프롬프트 구성:
1. `.claude/skills/code-review/backend-prompt.md` 파일의 전체 내용을 **Read로 읽어서** 프롬프트 앞부분에 포함
2. 그 아래에 백엔드 컨텍스트 + 대상 파일 diff/내용을 첨부
3. 교훈이 있으면 "## 이전 교훈" 섹션으로 추가

**중요: 두 에이전트를 동시에 호출하여 병렬 실행한다.**

---

## Phase 5: 결과 통합 & 리포트 출력

두 에이전트의 JSON 결과를 파싱하여 하나의 통합 리포트를 생성한다.

### ID 통합

- 프론트엔드: `F-C1`, `F-W1`, `F-I1`
- 백엔드: `B-C1`, `B-W1`, `B-I1`
- 심각도 순서: Critical → Warning → Info

### 리뷰 영역 판별

| 실행된 에이전트 | 리뷰 영역 표시 |
|----------------|----------------|
| 프론트엔드만 | `프론트엔드` |
| 백엔드만 | `백엔드` |
| 양쪽 모두 | `풀스택` |

### 출력 형식

```markdown
## 코드 리뷰 결과

> 리뷰 모드: {Diff / Staged / 전체 / 파일}
> 대상: {변경 파일 수}개 파일 (프론트 {n}개 + 백엔드 {n}개)
> 리뷰 영역: {프론트엔드 / 백엔드 / 풀스택}

---

### 요약

| 심각도 | 프론트엔드 | 백엔드 | 합계 |
|--------|-----------|--------|------|
| Critical | {n}개 | {n}개 | {n}개 |
| Warning | {n}개 | {n}개 | {n}개 |
| Info | {n}개 | {n}개 | {n}개 |
| Good | {n}개 | {n}개 | {n}개 |

---

### Critical — 반드시 수정 필요

#### {F-C1 또는 B-C1}. {이슈 제목}
- **파일**: `{파일경로}:{라인번호}`
- **카테고리**: {카테고리명}
- **문제**: {구체적인 문제 설명}
- **수정 제안**:
\`\`\`{language}
// Before
{기존 코드}

// After
{수정 코드}
\`\`\`

---

### Warning — 수정 권장

#### {F-W1 또는 B-W1}. {이슈 제목}
...

---

### Info — 개선하면 좋은 점

#### {F-I1 또는 B-I1}. {이슈 제목}
...

---

### Good — 잘한 점

**프론트엔드:**
- {잘한 점}

**백엔드:**
- {잘한 점}

---

### 다음 단계

자동 수정 가능한 항목이 {n}개 있습니다.
- "전부 수정해줘" — Critical + Warning 전부 자동 수정
- "F-C1 수정해줘" — 특정 항목만 수정
- "Critical만 수정해줘" — Critical 항목만 수정
- "프론트만 수정해줘" / "백엔드만 수정해줘" — 영역별 수정
- "리뷰만 볼게" — 수정 없이 리포트만 확인
```

한쪽 에이전트만 실행된 경우, 해당 영역의 결과만 출력한다 (프론트엔드/백엔드 열 분리 없이).

---

## Phase 6: 자동 수정 (Auto Fix)

사용자가 수정을 요청하면 리뷰에서 발견된 이슈를 직접 코드에 적용한다.

### 수정 대상 결정

| 입력 | 수정 범위 |
|------|-----------|
| "전부 수정해줘" / "fix all" | Critical + Warning 전체 |
| "Critical만" | Critical만 |
| "F-C1", "B-W2" 등 번호 지정 | 해당 항목만 |
| "F-C1, B-W1" 복수 지정 | 지정된 항목들만 |
| "프론트만 수정해줘" | F- 접두사 항목 전체 |
| "백엔드만 수정해줘" | B- 접두사 항목 전체 |

### 수정 실행

각 이슈에 대해:

1. **대상 파일 읽기**: `Read`로 최신 파일 내용 확인
2. **수정 적용**: `Edit`으로 Before → After 코드 교체
3. **수정 결과 기록**: 어떤 파일의 어떤 부분을 수정했는지 기록

**수정 규칙:**
- `Edit` 도구로 정확한 문자열 교체
- 한 파일에 여러 수정이면 위에서 아래 순
- 수정 전 반드시 `Read`로 현재 상태 재확인
- 수정 불가능한 항목은 건너뛰고 안내

### 빌드 검증

```bash
yarn build
```

빌드 실패 시:
1. 에러 메시지 분석
2. 수정이 원인이면 즉시 수정
3. 기존 에러면 사용자에게 안내

### 수정 결과 리포트

```markdown
## 수정 완료

### 적용된 수정 ({n}개)

| # | 이슈 | 파일 | 수정 내용 |
|---|------|------|-----------|
| F-C1 | {이슈 제목} | `{파일}:{라인}` | {수정 요약} |
| B-W1 | {이슈 제목} | `{파일}:{라인}` | {수정 요약} |

### 건너뛴 항목 ({n}개)

| # | 이슈 | 사유 |
|---|------|------|
| B-W3 | {이슈 제목} | 구조적 리팩토링 필요 — 수동 수정 권장 |

### 빌드: {성공/실패}
```

---

## 심각도 기준

| 심각도 | 기준 | 프론트 예시 | 백엔드 예시 |
|--------|------|-------------|-------------|
| **Critical** | 버그, 보안, 데이터 손실 | XSS, 무한루프, 메모리 누수 | 인증 우회, 환경변수 노출, RLS 미적용 |
| **Warning** | 성능, 접근성, 유지보수 | 불필요한 리렌더링, aria 누락 | N+1 쿼리, 입력 미검증, SOLID 위반 |
| **Info** | 스타일, 컨벤션 | 네이밍, 중복 클래스 | 매직 넘버, 응답 형식 불일치 |
| **Good** | 잘된 코드 | 적절한 컴포넌트 분리 | 깔끔한 에러 계층, Provider 추상화 |

---

## 주의사항

### 리뷰 원칙

1. **프로젝트 맥락 존중**: 이 프로젝트의 기존 패턴을 기준으로 리뷰
2. **실용적 피드백**: "이 코드에서 구체적으로~" 형태로
3. **수정 코드 제공**: Before/After 코드 포함
4. **과도한 지적 자제**: 실제 영향이 있는 것만
5. **칭찬 포함**: 잘한 점 반드시 언급
6. **공식 문서 근거**: 모범 사례 인용 시 공식 문서 참조

### SOLID 적용 기준

- SOLID은 **교조적으로 적용하지 않는다**. 실제 유지보수에 영향 있는 것만 지적
- 작은 유틸리티나 단순 컴포넌트에 강제하지 않는다
- "이 코드를 이렇게 바꾸면 ~할 때 편해집니다" 형태의 실용적 제안
- 과도한 추상화(불필요한 interface, 1회 사용 전략 패턴)는 오히려 Warning

### 하지 말 것

- 테스트 코드 작성 강요
- 과도한 추상화 제안
- 스타일 취향 지적 (세미콜론, 따옴표 등)
- 잘 동작하는 코드의 불필요한 리팩토링 제안
- 변경되지 않은 코드 지적 (Diff 모드)
- 미구현 코드에 대한 사전 지적

### 한글 리뷰

- 모든 리뷰 코멘트는 **한글**
- 기술 용어 (props, state, hook, SRP, SOLID 등)는 영문 가능
- 코드 예시의 주석도 한글

---

## Phase 7: 지식 저장 & 스택 레지스트리 업데이트

### 7-1. 리뷰 교훈 저장

리뷰 중 발견한 새로운 패턴이나 교훈을 `memory/skills/code-review-lessons.md`에 기록한다.
기존 교훈과 중복되면 skip.

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```

### 7-2. 스택 레지스트리 업데이트

Phase 0-2에서 스택 변경이 감지되었으면, `memory/skills/code-review-stack.md`를 업데이트한다.

형식:
```markdown
# 코드 리뷰 스택 레지스트리
> 마지막 업데이트: {YYYY-MM-DD}

## 현재 스택

### 프론트엔드
- next: 15.x
- react: 18.x
- tailwindcss: 3.x
- framer-motion: 12.x
- {새로 추가된 패키지}: {버전}

### 백엔드
- @supabase/ssr: x.x
- zod: 4.x
- {새로 추가된 패키지}: {버전}

## 스택 변경 이력
- {YYYY-MM-DD}: {패키지명} 추가 — {리뷰 시 주의할 점}
```

이 파일은 다음 리뷰 때 Phase 0-2에서 비교 기준으로 사용된다.
