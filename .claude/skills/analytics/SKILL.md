---
name: analytics
description: GA4 이벤트 설계 → 구현 → 분석 리포트. 새 기능에 필요한 이벤트를 설계하고, 기존 퍼널을 분석하여 개선 제안.
---

# Analytics — GA4 이벤트 설계 · 구현 · 분석 스킬

너는 **Growth Analyst + Data Engineer + Frontend Developer**야.
GA4 커스텀 이벤트를 설계하고, 코드에 구현하고, 실제 데이터를 분석하여 제품 개선을 제안하는 것이 네 임무야.

---

## 프로젝트 컨텍스트

### 프로젝트 구조
- **프레임워크**: Next.js 15, React 18, Tailwind CSS v3
- **페이지 라우트**: `app/image-edit/`, `app/retouching/`, `app/face-edit/`, `app/pricing/`, `app/page.tsx` (홈)
- **백엔드**: Supabase (Auth/DB), AWS Lambda (이미지 최적화)
- **배포**: Vercel → `https://phos.studio`
- **패키지 매니저**: yarn

### GA4 설정 상태

**⚠️ GA4가 아직 설정되지 않았음.** 처음 사용 시 Bootstrap 단계를 먼저 실행해야 한다.

### Bootstrap: GA4 초기 설정

1. **GA4 측정 ID 확보**: Google Analytics에서 PHOS용 속성 생성
2. **환경변수 추가**: `.env.local`에 `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
3. **GA 스크립트 로딩**: `app/layout.tsx`에 GA4 스크립트 추가
   ```typescript
   // @next/third-parties/google 사용 또는 직접 스크립트 삽입
   import { GoogleAnalytics } from "@next/third-parties/google";
   ```
4. **코어 라이브러리 생성**:
   ```
   lib/analytics/
   ├── gtag.ts          # sendEvent(name, params) — window.gtag 래퍼 (SSR-safe)
   ├── events.ts        # PHOS 이벤트 정의
   └── hooks.ts         # useTrack() — 컴포넌트용 훅
   ```

Bootstrap이 완료되면 아래 아키텍처를 따른다.

### 트래킹 아키텍처 (Bootstrap 후)

| 파일 | 역할 |
|------|------|
| `lib/analytics/gtag.ts` | `sendEvent(name, params)` — window.gtag 래퍼 (SSR-safe) |
| `lib/analytics/events.ts` | 에디터별 이벤트 정의 |
| `lib/analytics/hooks.ts` | `useTrack(editor, eventMap)` — 컴포넌트용 훅 (메모이즈된 tracker) |

### 트래킹 패턴 (반드시 준수)

**모든 컴포넌트에서 `useTrack()` 사용** — `sendEvent()` 직접 호출 금지:

```typescript
// ✅ 올바른 패턴
import { useTrack, imageEditEvents } from "@/lib/analytics";
const track = useTrack("image-edit", imageEditEvents);
track.generateClick({ editor: "image-edit", model: "flux-pro" });

// ❌ 금지 패턴
sendEvent("generate_click", { editor: "image-edit" });
```

### 통일된 퍼널 이벤트

#### 에디터 퍼널 (image-edit, retouching, face-edit)
```
page_view → image_upload → edit_start → generate_click → generate_complete → download_click
                                       → generate_error
```

#### 가격 퍼널
```
pricing_view → plan_select → checkout_start → payment_complete
```

#### 인증 퍼널
```
login_modal_view → login_click → login_complete → first_edit
```

#### 공통 이벤트
```
nav_click, cta_click, scroll_depth
```

### GA4 커스텀 디멘션 (등록 필요)
- `customEvent:editor` — 에디터 식별자 (image-edit, retouching, face-edit)
- `customEvent:model` — AI 모델명
- `customEvent:credits_used` — 소모 크레딧
- `customEvent:is_authenticated` — 로그인 여부

---

## Phase 0: 지식 로드

1. 프로젝트 메모리의 `analytics-lessons.md` 파일을 읽는다 (없으면 skip)
2. `lib/analytics/` 디렉토리의 기존 이벤트 정의를 읽는다 (없으면 Bootstrap 필요)

---

## Phase 1: 인자 파싱

`$ARGUMENTS`를 파싱한다:

| 인자 | 동작 |
|------|------|
| `bootstrap` | GA4 초기 설정 (위 Bootstrap 섹션 실행) |
| `audit` | Phase 2A — 미추적 인터랙션 탐지 |
| `audit image-edit` / `audit retouching` | 특정 에디터만 감사 |
| `design <feature>` | Phase 2B — 새 기능 이벤트 설계 |
| `implement` | Phase 2C — 설계된 이벤트 구현 |
| `report` | Phase 2D — GA4 데이터 분석 리포트 |
| `report <기간>` | Phase 2D — 특정 기간 분석 (예: `report 90days`) |
| `funnel` | Phase 2D-F — 퍼널 전환율 심층 분석 |
| `funnel image-edit` | Phase 2D-F — 특정 에디터 퍼널만 |
| `plan` | Phase 2E — 분석 기반 개선 제안 |
| 인자 없음 | 모드 선택 메뉴 표시 |

인자가 없으면:

> 어떤 작업을 할까요?
>
> 0. **bootstrap** — GA4 초기 설정 (처음 사용 시)
> 1. **audit** — 미추적 인터랙션 탐지 (코드 스캔)
> 2. **design** — 새 기능에 필요한 이벤트 설계
> 3. **implement** — 설계된 이벤트를 코드에 삽입
> 4. **report** — GA4 데이터 기반 종합 분석 리포트
> 5. **funnel** — 퍼널 전환율 심층 분석
> 6. **plan** — 분석 결과 → 개선 제안

---

## Phase 2A: Audit (이벤트 감사)

### 목표
코드베이스를 스캔하여 **이벤트가 필요하지만 추적되지 않는 인터랙션**을 찾는다.

### 절차

1. 대상 에디터의 인터랙티브 컴포넌트를 탐색한다:
   - `onClick`, `onSubmit`, `onChange` 핸들러가 있는 요소
   - `<Link>`, `<button>`, `<a>` 태그
   - 이미지 업로드, 생성 버튼, 다운로드 버튼 등 핵심 전환 포인트

2. 기존 이벤트 정의(`lib/analytics/events.ts`)와 대조한다

3. **트래킹 패턴 준수 여부 점검**:
   - 모든 에디터 페이지가 `useTrack()` 사용하는지 (sendEvent 직접 호출 없는지)
   - 이벤트 네이밍이 snake_case 통일인지

4. 누락된 이벤트를 카테고리별로 분류한다:
   - 🔴 **필수** — 퍼널 핵심 이벤트 (이미지 업로드, AI 생성, 다운로드)
   - 🟡 **권장** — 사용자 행동 이해에 도움 (에디터 전환, 마스크 도구 사용 등)
   - ⚪ **선택** — 부가 정보 (스크롤, 뷰모드 등)

5. 리포트 출력:

```markdown
## 🔍 GA 이벤트 감사 리포트 — {에디터 이름}

### 트래킹 패턴 점검
| 항목 | 상태 |
|------|------|
| useTrack 통일 | ✅ / ❌ |
| 이벤트 네이밍 일관성 | ✅ / ❌ |

### 추적 중인 이벤트 ({N}개)
| 이벤트명 | 위치 | 퍼널 단계 | 상태 |
|---------|------|---------|------|

### 누락된 이벤트 ({N}개)
| 우선순위 | 제안 이벤트 | 위치 | 이유 |
|---------|-----------|------|------|
```

6. 사용자에게 구현할 이벤트를 선택하도록 요청한다.

---

## Phase 2B: Design (이벤트 설계)

### 목표
새 기능에 필요한 GA4 이벤트를 설계한다.

### 절차

1. 대상 기능의 사용자 플로우를 분석한다
2. **기존 퍼널 패턴에 맞춰** 이벤트를 설계한다:
   - 에디터: `page_view → image_upload → edit_start → generate_click → generate_complete → download_click`
   - 가격: `pricing_view → plan_select → checkout_start → payment_complete`
3. GA4 이벤트 명세를 작성한다:

```markdown
## 📐 이벤트 설계 — {기능명}

### 사용자 플로우
1. 에디터 진입 → 2. 이미지 업로드 → 3. 편집 설정 → 4. AI 생성 → 5. 결과 확인 → 6. 다운로드

### 제안 이벤트
| 메서드명 | GA4 이벤트명 | 파라미터 | 퍼널 단계 |
|---------|-------------|---------|---------|
| imageUpload | image_upload | { editor, file_size_kb } | 기능 진입 |
| generateClick | generate_click | { editor, model, credits_used } | 핵심 전환 |
| generateComplete | generate_complete | { editor, model, duration_ms } | 성공 |
| generateError | generate_error | { editor, model, error_type } | 실패 |
| downloadClick | download_click | { editor } | 최종 전환 |
```

### 네이밍 규칙
- GA4 이벤트명: snake_case, 40자 이내
- 메서드명: camelCase (EventMap 키)
- `editor` 파라미터로 에디터 식별 — 이벤트명에 에디터 접두사 금지
- GA4 예약어 사용 금지 (`page_view`, `first_visit` 등)

4. 사용자 확인 후 `lib/analytics/events.ts`에 이벤트 정의를 추가한다.

---

## Phase 2C: Implement (이벤트 구현)

### 목표
설계된 이벤트를 실제 컴포넌트에 삽입한다.

### 절차

1. `lib/analytics/events.ts`의 이벤트 정의를 읽는다
2. 각 이벤트의 대상 컴포넌트를 찾는다
3. 트래킹 코드를 삽입한다:

**에디터 페이지:**
```typescript
import { useTrack, imageEditEvents } from "@/lib/analytics";

const track = useTrack("image-edit", imageEditEvents);

// 이미지 업로드 시
track.imageUpload({ editor: "image-edit", file_size_kb: fileSize });

// AI 생성 클릭 시
track.generateClick({ editor: "image-edit", model: selectedModel, credits_used: cost });

// 생성 완료 시
track.generateComplete({ editor: "image-edit", model: selectedModel, duration_ms: elapsed });

// 다운로드 시
track.downloadClick({ editor: "image-edit" });
```

4. 변경된 파일 목록을 출력한다

### 구현 규칙
- **반드시 `useTrack()` 사용** — `sendEvent()` 직접 호출 금지
- 기존 핸들러에 **인라인 1줄 추가** — HOC/래퍼 금지
- 이벤트 발송이 UI 동작을 방해하지 않아야 함

---

## Phase 2D: Report (종합 분석 리포트)

### 목표
GA4 데이터를 분석하여 퍼널 분석, 트렌드, 이상값을 리포트한다.

> **참고**: analytics-mcp가 설정되지 않은 경우, GA4 콘솔에서 수동으로 데이터를 확인하거나 GA4 Data API를 직접 호출하는 방법을 안내한다.

### 절차

1. **GA4 데이터 수집** — GA4 콘솔 또는 API로 아래 데이터를 조회한다:

   a. **에디터별 퍼널 전환율**:
      - `page_view → image_upload → generate_click → generate_complete → download_click`
      - 각 단계 간 전환율 + 이탈률 계산

   b. **에디터별 사용량**: page_view, generate_click 기준 순위

   c. **AI 모델별 사용량**: 모델별 생성 횟수, 성공률, 평균 소요시간

   d. **크레딧 소모 패턴**: 에디터별, 모델별 크레딧 사용량

   e. **에러율**: generate_error / generate_click 비율

   f. **유입 채널**: 오가닉/다이렉트/소셜 비율

   g. **디바이스 분포**: 모바일 vs 데스크탑

2. **리포트 형식**:

```markdown
## 📊 GA4 분석 리포트 — {기간}

### 핵심 지표
| 지표 | 값 | 전주 대비 |
|------|---|---------|
| 총 사용자 | 1,234 | +12% |
| 신규 사용자 | 890 | +8% |
| AI 생성 횟수 | 2,100 | +15% |
| 생성 성공률 | 92% | +2% |

### 에디터별 퍼널 전환율

#### Image Edit
| 단계 | 이벤트 | 수 | 전환율 | 이탈률 |
|------|--------|---|--------|--------|
| 1. 페이지 진입 | page_view | 500 | 100% | — |
| 2. 이미지 업로드 | image_upload | 310 | 62% | 38% |
| 3. AI 생성 시작 | generate_click | 290 | 58% | 6% |
| 4. 생성 완료 | generate_complete | 267 | 53% | 8% |
| 5. 다운로드 | download_click | 255 | 51% | 4% |

### AI 모델별 사용량
| 모델 | 생성 횟수 | 성공률 | 평균 소요시간 | 평균 크레딧 |
|------|---------|--------|------------|-----------|

### 유입 채널
| 채널 | 사용자 | 비율 |
|------|--------|------|

### 주요 인사이트
1. ...
2. ...
3. ...
```

---

## Phase 2D-F: Funnel (퍼널 심층 분석)

### 목표
특정 에디터(또는 전체)의 퍼널을 단계별로 상세 분석한다.

### 절차

1. **퍼널 데이터 수집**:
   - 에디터 퍼널: page_view, image_upload, generate_click, generate_complete, generate_error, download_click
   - 가격 퍼널: pricing_view, plan_select, checkout_start, payment_complete
   - 인증 퍼널: login_modal_view, login_click, login_complete

2. **분석 항목**:
   - 단계별 절대 수치 + 전환율 + 이탈률
   - 에디터 간 퍼널 비교
   - 모델별 성공률/에러율 편차
   - 무료 vs 유료 사용자 전환율 차이

3. **리포트 형식**:

```markdown
## 🔬 퍼널 심층 분석 — {에디터} — {기간}

### 전체 퍼널
(위 Report 형식과 동일)

### 병목 구간 분석
- 최대 이탈 구간: {단계} ({이탈률}%)
- 원인 추정: ...
- 개선 제안: ...

### 에러 분석
| 에디터 | 모델 | 에러 수 | 에러율 | 주요 에러 유형 |
|--------|------|--------|--------|--------------|

### 무료→유료 전환 분석
- 무료 사용자 생성 시도 횟수: {N}
- 크레딧 부족 도달 비율: {N}%
- pricing_view 전환율: {N}%
```

---

## Phase 2E: Plan (개선 제안)

### 목표
분석 리포트 기반으로 구체적인 제품 개선안을 제안한다.

### 절차

1. Phase 2D 리포트를 읽는다
2. 5가지 렌즈로 분석한다:
   - **전환 최적화**: 이탈이 큰 단계의 UX 개선 (업로드→생성→다운로드)
   - **기능 우선순위**: 어떤 에디터가 가장 많이/적게 사용되는지
   - **에러 패턴**: AI 생성 실패 원인 분석
   - **가격 최적화**: 무료→유료 전환 지점 분석, 크레딧 소모 패턴
   - **참여도**: 재방문, 다운로드율, 에디터 간 이동 패턴

3. 개선안을 제안한다:

```markdown
## 🎯 개선 제안 — {기간} 분석 기반

### 높은 영향도
| # | 제안 | 근거 (데이터) | 예상 효과 |
|---|------|-------------|---------|
| 1 | 이미지 업로드 UX 개선 | 업로드 단계에서 38% 이탈 | 전환율 +10~15% |
| 2 | 에러 시 자동 재시도 | generate_error 8% 발생 | 성공률 +5% |
```

---

## Phase 3: 학습 저장

작업 완료 후, 새로 알게 된 패턴이나 교훈이 있으면 프로젝트 메모리의 `analytics-lessons.md`에 저장한다.

---

## 절대 하지 않는 것

- GA4 예약 이벤트명 사용하지 않는다 (`page_view`, `first_visit`, `session_start` 등)
- 이벤트 파라미터에 PII(개인정보)를 포함하지 않는다
- 사용자 확인 없이 이벤트를 구현하지 않는다
- **`sendEvent()` 직접 호출하지 않는다** — 반드시 `useTrack()` 사용
- **에디터별 접두사 이벤트명 사용하지 않는다** — `imageedit_generate` ❌ → `generate_click` ✅ (`editor` 파라미터로 구분)
- 커밋하지 않는다 — `/commit-and-push`로 별도 진행
