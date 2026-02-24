# api-builder — API Route 생성기

Next.js App Router의 Route Handler와 Zod 검증 스키마를 생성합니다.

## 사용법

```
/api-builder <명령>
```

### 명령 형식

- `/api-builder image/upscale` — CRUD 엔드포인트 생성
- `/api-builder image/upscale --methods=POST` — 특정 메서드만
- `/api-builder image/upscale --ai` — AI 처리 + 크레딧 차감 포함
- `/api-builder auth/login --no-auth` — 인증 미들웨어 제외

## Phase별 실행

### Phase 0: 지식 + 인프라 확인

1. `memory/skills/api-builder-lessons.md` 파일을 읽는다 (없으면 skip)
2. 인프라 파일 존재 확인:
   - `lib/supabase/middleware.ts` (withAuth)
   - `lib/errors/index.ts` (에러 클래스)
   - `lib/types/api.ts` (응답 타입)
   - `lib/types/database.ts` (DB 타입)
3. 없는 파일이 있으면 사용자에게 안내: "인프라 파일이 없습니다. 먼저 기반 코드를 설정해주세요."
4. 관련 테이블의 타입 정보를 `database.ts`에서 확인한다

### Phase 1: 인자 파싱

`$ARGUMENTS`를 분석하여 결정:
- **path**: API 경로 (예: `image/upscale` → `app/api/image/upscale/route.ts`)
- **methods**: HTTP 메서드 목록 (기본: `GET,POST`)
- **options**:
  - `--ai`: AI 처리 엔드포인트 (크레딧 차감 로직 포함)
  - `--no-auth`: 인증 미들웨어 제외
  - `--methods=POST,GET`: 특정 메서드만 생성
  - `--crud`: 전체 CRUD (GET, POST, PATCH, DELETE)

### Phase 2: 스펙 결정

경로와 옵션을 기반으로 각 메서드의 스펙을 설계:
- 요청 body/query 필드
- 응답 데이터 구조
- 인증 필요 여부
- 크레딧 비용 (AI 엔드포인트)
- 관련 DB 테이블

### Phase 3: Zod 스키마 생성

파일: `lib/validations/{name}.ts`

```typescript
import { z } from "zod";

export const create{Name}Schema = z.object({
  // 필드 정의
});

export type Create{Name}Input = z.infer<typeof create{Name}Schema>;
```

**규칙**:
- 파일 업로드: `z.string()` (base64 또는 URL)
- 이미지 크기: `z.number().min(1).max(4096)`
- 텍스트 입력: `z.string().min(1).max(500)`
- 선택 필드: `.optional()`
- 열거형: `z.enum([...])`

### Phase 4: Route Handler 생성

파일: `app/api/{path}/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/middleware";
import { create{Name}Schema } from "@/lib/validations/{name}";
import type { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(async (request, { supabase, user }) => {
  // 1. 요청 파싱 + 검증
  const body = await request.json();
  const input = create{Name}Schema.parse(body);

  // 2. 비즈니스 로직 (TODO: service-builder가 채움)

  // 3. 응답
  const response: ApiResponse<typeof data> = { success: true, data };
  return NextResponse.json(response);
});
```

**인증 미들웨어 적용 규칙**:
- 기본: `withAuth` 래퍼 사용
- `--no-auth`: 래퍼 없이 직접 export

**AI 엔드포인트 추가 로직** (`--ai`):
```typescript
// 크레딧 확인
const { data: credit } = await supabase
  .from("credits")
  .select("balance")
  .eq("user_id", user.id)
  .single();

if (!credit || credit.balance < COST) {
  throw new CreditError("크레딧이 부족합니다", COST, credit?.balance ?? 0);
}

// AI 처리 (TODO)

// 크레딧 차감
await supabase
  .from("credits")
  .update({ balance: credit.balance - COST })
  .eq("user_id", user.id);
```

**Zod 에러 핸들링**:
```typescript
import { ValidationError } from "@/lib/errors";

try {
  const input = schema.parse(body);
} catch (err) {
  if (err instanceof z.ZodError) {
    const fields: Record<string, string[]> = {};
    err.issues.forEach((issue) => {
      const path = issue.path.join(".");
      fields[path] = fields[path] || [];
      fields[path].push(issue.message);
    });
    throw new ValidationError("입력값이 올바르지 않습니다", fields);
  }
  throw err;
}
```

### Phase 5: 빌드 검증

1. `yarn build` 실행
2. 타입 에러 수정
3. import 경로 확인

### Phase 6: 가이드 출력

생성 완료 후 출력:
1. 생성된 파일 목록
2. 엔드포인트 스펙 요약 (메서드, 경로, 필드)
3. curl 테스트 명령어 예시
4. 다음 단계: `/test-api POST /api/{path}` 안내

### Phase 7: 지식 저장

실행 중 발생한 교훈을 `memory/skills/api-builder-lessons.md`에 기록.

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```
