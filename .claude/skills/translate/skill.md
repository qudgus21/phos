---
name: translate
description: i18n 하드코딩 완전 제거 + 번역 품질 검증. 단 한 글자도 놓치지 않는다. 파일 하나씩 완전히 읽고 수정.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent
user-invocable: true
---

# Translate — 한 글자도 놓치지 않는 i18n 완전 감사 스킬

## ARGUMENTS 파싱

- 인자에 `infinite` 또는 `--infinite` 포함 → **무한루프 모드**: 빌드 성공 + 한국어 0건 + TypeScript 0 errors 달성할 때까지 Phase 1~5를 반복. 최대 10라운드.
- 인자에 `all` 또는 없음 → 전체 파일 감사
- 특정 영역 인자 → 해당 영역만 감사

## 핵심 원칙 (항상 기억)

1. **의심하라**: "이미 됐겠지" 금지. 파일마다 직접 Read해서 눈으로 확인한다.
2. **하나씩 완전히**: 파일 하나를 완전히 끝낸 후 다음 파일로 넘어간다.
3. **dict 주입 패턴**: 클라이언트 컴포넌트는 `useDictionary()` 훅으로 dict 접근.
4. **영어(en)가 1순위**: en.ts 번역 품질이 최우선 — 실제 영미권 SaaS 톤.
5. **단 한 글자도**: 사용자 눈에 보이는 텍스트는 전부 dict로.

## ⚠️ 중요 아키텍처 주의사항

### DictionaryProvider 범위
- `DictionaryProvider`는 `app/[locale]/layout.tsx`에서만 제공됨
- `app/layout.tsx`의 `ToastProvider`는 **DictionaryProvider 바깥**에 위치
- **절대 금지**: `ToastProvider`와 같이 루트 레이아웃에서 렌더되는 컴포넌트에 `useDictionary()` 추가 금지
- 예외 처리가 필요한 컴포넌트: `components/ui/toast.tsx` → aria-label은 하드코딩 영어 허용 (`aria-label="Close"`)

### 컴포넌트 예외 목록 (useDictionary 사용 불가)
- `components/ui/toast.tsx` (ToastProvider는 root layout에서 렌더)
- 다른 root layout 직속 컴포넌트들 (ThemeProvider 등)

---

## 프로젝트 핵심 정보

### dict 접근 방법

**서버 컴포넌트 (page.tsx, layout.tsx):**
```typescript
import { getDictionary } from "@/lib/i18n";
const dict = await getDictionary(locale as Locale);
// props로 전달 또는 DictionaryProvider로 감쌈
```

**클라이언트 컴포넌트 ("use client"):**
```typescript
import { useDictionary } from "@/lib/i18n/dictionary-context";
// 컴포넌트 내부:
const dict = useDictionary();
```

`DictionaryProvider`는 이미 `app/[locale]/layout.tsx`에 세팅되어 있으므로,  
**모든 클라이언트 컴포넌트는 `useDictionary()`를 바로 사용**할 수 있다.

### 딕셔너리 위치
- 타입: `lib/i18n/config.ts` → `Dictionary` 인터페이스
- 파일: `lib/i18n/dictionaries/{ko,en,zh,es,ar,id,pt,fr,ja,ru,de}.ts`
- 로케일: 11개 (ko, en, zh, es, ar, id, pt, fr, ja, ru, de)
- 기본 로케일: **en** (영미권 1순위)

### 하드코딩 아닌 것 (스킵)
- 브랜드명: "Phos AI", "Phos", "phos.support@gmail.com"
- AI 모델명: "Seedream 5.0", "Nano Banana 2", "Nano Banana Pro"
- 플랜명: "Free", "Basic", "Pro", "Premium"
- 해상도: "1K", "2K", "3K", "4K", "Auto"
- 비율: "2:3", "3:2", "9:16", "16:9", "1:1"
- 파일 형식: "JPG", "PNG", "GIF", "WebP"
- 기술 용어: "AI", "SaaS", "Before", "After" (슬라이더 라벨은 dict에 있음)
- 코드 주석 (`//`, `/* */`)
- 개발자용 console.log

---

## 감사 대상 파일 목록 (빠짐없이 전부)

### A. 툴 페이지 — 클라이언트 컴포넌트 (useDictionary 사용)

#### Image Edit 툴
- [ ] `components/sections/image-edit/image-edit-input-panel.tsx`
- [ ] `components/sections/image-edit/image-edit-result-panel.tsx`
- [ ] `components/sections/image-edit/image-edit-history-panel.tsx`
- [ ] `components/sections/image-edit/image-edit-sample-sidebar.tsx`
- [ ] `components/sections/image-edit/favorite-save-modal.tsx`
- [ ] `components/sections/image-edit/image-edit-mobile-tabs.tsx`

#### Retouching 툴
- [ ] `components/sections/retouching/retouching-input-panel.tsx`
- [ ] `components/sections/retouching/retouching-result-panel.tsx`
- [ ] `components/sections/retouching/retouching-history-panel.tsx`
- [ ] `components/sections/retouching/retouching-sample-sidebar.tsx`
- [ ] `components/sections/retouching/retouching-favorite-save-modal.tsx`
- [ ] `components/sections/retouching/retouching-mobile-tabs.tsx`

#### Face Edit 툴
- [ ] `components/sections/face-edit/face-edit-input-panel.tsx`
- [ ] `components/sections/face-edit/face-edit-result-panel.tsx`
- [ ] `components/sections/face-edit/face-edit-sample-sidebar.tsx`
- [ ] `components/sections/face-edit/face-edit-favorite-save-modal.tsx`
- [ ] `components/sections/face-edit/face-edit-mask-editor.tsx`
- [ ] `components/sections/face-edit/face-edit-mobile-tabs.tsx`

#### Pricing 페이지
- [ ] `components/sections/pricing/pricing-cards.tsx`
- [ ] `components/sections/pricing/pricing-faq.tsx`
- [ ] `components/sections/pricing/pricing-header.tsx`
- [ ] `components/sections/pricing/discord-fab.tsx`
- [ ] `app/[locale]/pricing/pricing-content.tsx`

#### Contact 페이지
- [ ] `app/[locale]/contact/contact-form.tsx`

### B. 공통 UI 컴포넌트
- [ ] `components/ui/login-modal.tsx`
- [ ] `components/ui/confirm-modal.tsx`
- [ ] `components/ui/download-button.tsx`
- [ ] `components/ui/language-selector.tsx`

### C. 홈 랜딩 섹션 (서버 컴포넌트)
- [ ] `components/sections/hero.tsx`
- [ ] `components/sections/image-edit.tsx`
- [ ] `components/sections/skin-retouch.tsx`
- [ ] `components/sections/face-swap.tsx`
- [ ] `components/sections/skin-realism.tsx`
- [ ] `components/sections/upscale.tsx`

### D. 네비게이션 / 푸터
- [ ] `components/sections/navigation.tsx`
- [ ] `components/sections/footer.tsx`

### E. 법적 페이지 (메타데이터만 번역, 본문 영어 유지)
- [ ] `app/[locale]/terms/page.tsx`
- [ ] `app/[locale]/privacy/page.tsx`
- [ ] `app/[locale]/data-deletion/page.tsx`

### F. 에러 / 공통
- [ ] `lib/errors/index.ts`

### G. Hooks (클라이언트 훅 — 에러/토스트 메시지)
- [ ] `hooks/use-generation-realtime.ts`
- [ ] `hooks/use-favorites.ts`

### H. 상수 / 샘플 데이터 (alt, label 등 사용자 노출 텍스트)
- [ ] `lib/constants/retouching-samples.ts`
- [ ] `lib/constants/samples.ts`

### I. 페이지 레벨 에러 메시지
- [ ] `app/[locale]/image-edit/page.tsx`
- [ ] `app/[locale]/face-edit/page.tsx`
- [ ] `app/[locale]/retouching/page.tsx`

### J. API 라우트 (서버 에러 메시지 — 영어 유지)
- [ ] `app/api/checkout/route.ts`
- [ ] `app/api/contact/route.ts`
- [ ] `app/api/portal/route.ts`
- [ ] `app/api/upload/route.ts`
- [ ] `app/api/history/route.ts`
- [ ] `app/api/image-edit/generate/route.ts`
- [ ] `app/api/retouching/generate/route.ts`
- [ ] `app/api/face-edit/generate/route.ts`
- [ ] `app/api/admin/reconcile/route.ts`
- [ ] `app/api/admin/users/route.ts`

### K. 서비스 / 유틸리티 (서버 에러 메시지 — 영어 유지)
- [ ] `lib/services/credits/index.ts`
- [ ] `lib/services/generation/background.ts`
- [ ] `lib/services/contact/email.ts`
- [ ] `lib/services/ai/replicate-files.ts`
- [ ] `lib/services/ai/upscaler.ts`
- [ ] `lib/services/ai/providers/replicate.ts`
- [ ] `lib/services/ai/providers/byteplus.ts`
- [ ] `lib/services/ai/prompts/skin-retouch.ts`
- [ ] `lib/supabase/middleware.ts`
- [ ] `lib/utils/compress-image.ts`
- [ ] `lib/utils/download-image.ts`
- [ ] `lib/validations/image-generation.ts`

### L. OG 이미지 / 메타
- [ ] `app/opengraph-image.tsx`

---

## 실행 절차 (이 순서대로 정확히 수행)

### Phase 1: 파일별 완전 감사 + 즉시 수정

**각 파일에 대해 다음을 수행한다:**

1. **Read** — 파일 전체를 읽는다. 2000줄 이상이면 offset을 써서 전부 읽는다.
2. **하드코딩 목록 작성** — 한국어, 영어 하드코딩 문자열을 전부 나열한다.
3. **dict 키 매핑** — 각 하드코딩을 어느 dict 키에 넣을지 결정한다.
4. **신규 키 추가** — config.ts Dictionary 타입에 없으면 추가한다.
5. **ko.ts / en.ts 업데이트** — 한국어/영어 값 추가 (en은 네이티브 SaaS 톤).
6. **나머지 9개 로케일 업데이트** — zh, es, ar, id, pt, fr, ja, ru, de 전부 해당 언어로 번역.
7. **컴포넌트 수정** — 하드코딩을 dict 참조로 교체.

**클라이언트 컴포넌트 수정 패턴:**
```typescript
// 기존
import { useState } from "react";
// ...
const label = "이미지 업로드";
toast("저장했습니다", "success");

// 수정 후
import { useState } from "react";
import { useDictionary } from "@/lib/i18n/dictionary-context";
// ...
const dict = useDictionary();
const label = dict.tools.retouching.uploadImage;
toast(dict.tools.favorites.saved, "success");
```

**모듈 레벨 상수 배열 처리 (함수 안으로 이동):**
```typescript
// 기존 — 모듈 레벨에 하드코딩
const FILTER_OPTIONS = [
  { id: "none", label: "없음" },
  { id: "studio", label: "스튜디오" },
];

// 수정 후 — 컴포넌트 내부에서 dict 사용
function MyComponent() {
  const dict = useDictionary();
  const FILTER_OPTIONS = [
    { id: "none", label: dict.tools.retouching.filters.none },
    { id: "studio", label: dict.tools.retouching.filters.studio },
  ];
  // ...
}
```

### Phase 2: 딕셔너리 영어 잔류 검사

Phase 1 완료 후:
1. `en.ts`의 값들과 `zh.ts`, `es.ts`, `ar.ts`, `id.ts`, `pt.ts`, `fr.ts`, `ja.ts`, `ru.ts`, `de.ts`를 비교
2. **en.ts와 동일한 값 = 미번역** → 해당 언어로 즉시 번역
3. 특히 방금 추가한 신규 키들을 9개 로케일에 모두 번역했는지 확인

### Phase 3: TypeScript 타입 검사

```bash
cd /Applications/hbh/dev/phos && npx tsc --noEmit 2>&1 | grep "error TS"
```

에러 있으면 즉시 수정.

### Phase 4: 빌드 검증

```bash
cd /Applications/hbh/dev/phos && yarn build
```

실패 시 즉시 수정.

### Phase 5: 재스캔

빌드 성공 후 다시 grep으로 한국어 하드코딩 잔류 확인:

```bash
# 한국어 잔류 확인 (주석/dict파일 제외)
grep -rn "[가-힣]" components/ app/ --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|dictionaries\|skills" \
  | grep -v "^.*://\|^.*/\*"
```

발견 시 Phase 1로 돌아가서 수정.

### Infinite 모드 루프

`infinite` 인자가 있으면 아래 조건이 모두 충족될 때까지 Phase 1~5를 반복:
- ✅ 한국어 잔류 0건 (주석 제외)
- ✅ TypeScript: 0 errors  
- ✅ Build: 성공

```
ROUND = 1
WHILE NOT (한국어 0건 AND TS 0 AND 빌드 성공):
  Phase 1: 파일별 완전 감사 + 수정
  Phase 2: 딕셔너리 영어 잔류 검사  
  Phase 3: TypeScript 체크 → 실패 시 수정
  Phase 4: 빌드 → 실패 시 수정
  Phase 5: 재스캔
  ROUND += 1
  IF ROUND > 10: 사용자에게 리포트 후 종료
```

---

## 감사 우선순위 (이 순서로)

1. **Retouching 툴** — input-panel, sample-sidebar, favorite-save-modal, history-panel, result-panel
2. **Image Edit 툴** — input-panel, sample-sidebar, favorite-save-modal, history-panel, result-panel
3. **Face Edit 툴** — input-panel, sample-sidebar, favorite-save-modal, mask-editor, result-panel
4. **Pricing 페이지** — pricing-cards, pricing-faq, pricing-header
5. **공통 UI** — login-modal, confirm-modal, download-button
6. **홈 랜딩 섹션** — hero, image-edit, skin-retouch, face-swap, skin-realism, upscale
7. **Contact 폼**
8. **Navigation / Footer**

---

## 번역 품질 규칙

### en.ts가 1순위
- SaaS 마케팅 톤: 간결하고 힘 있는 문장
- 번역투 절대 금지: "이미지를 업로드하여 시작하세요" → "Upload an image to get started"
- 참고 서비스 톤: Figma, Linear, Vercel

### 각 언어 품질 기준
- **zh**: 간결한 중문 SaaS 톤
- **ja**: 정중하지만 현대적인 です/ます
- **ko**: 기존 워딩 그대로 유지 (임의 변경 금지!)
- **ar**: Modern Standard Arabic, 기술 용어는 라틴 문자 유지 가능
- **나머지**: 각 언어의 네이티브 SaaS 서비스 톤

### 템플릿 변수 유지
`{count}`, `{max}`, `{current}`, `{credits}`, `{days}`, `{plan}`, `{email}`, `{min}`, `{hr}`, `{day}`, `\n` — 절대 변경 금지

---

## 자주 놓치는 함정

1. **모듈 레벨 상수 배열**: 파일 최상단에 `const OPTIONS = [{label: "한국어"}]` 패턴 — 컴포넌트 내부로 이동해서 dict 사용
2. **toast 메시지**: 이벤트 핸들러 깊숙이 숨어있음
3. **aria-label / placeholder**: JSX 속성에 하드코딩
4. **조건부 문자열**: `selected.length === 0 ? "기본값" : "다른값"` 패턴
5. **template literal**: `` `${count}개 부위 제외` `` 패턴
6. **에러 throw**: `throw new Error("한국어 메시지")` 패턴
7. **catch 블록**: `err instanceof Error ? err.message : "실패했습니다"` 패턴
8. **confirm-modal 기본값**: `title`, `description` prop 기본값이 하드코딩
9. **즐겨찾기 모달**: 각 툴마다 별도 모달 파일 있음 (image-edit, retouching, face-edit)
10. **샘플 사이드바**: 각 툴마다 별도 파일 있음 (tabs, sidebar)

---

## 최종 리포트 형식

```
## i18n 감사 완료

### 처리 파일
| 파일 | 발견 | 수정 |
|------|------|------|
| retouching-input-panel.tsx | 23건 | 23건 |
...

### 딕셔너리 신규 키
- tools.retouching.* : +N개 키
- tools.imageEdit.* : +N개 키
...

### 미번역 수정
- 9개 로케일 × N개 키 번역

### 결과
- TypeScript: ✅ 0 errors
- Build: ✅ 성공
- 한국어 잔류: ✅ 0건 (허용 항목 제외)
```

---

## 절대 하지 않는 것
- "이미 됐을 것 같다"고 파일 스킵 — 반드시 직접 Read
- 커밋 — `/commit`으로 별도 진행
- 기존 한국어(ko.ts) 워딩 임의 변경
- 영어 fallback을 9개 로케일에 그대로 복붙
