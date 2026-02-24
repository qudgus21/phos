# db-model — Supabase 스키마 관리자

Supabase 데이터베이스 테이블, RLS 정책, Storage 버킷을 설계하고 SQL 마이그레이션 파일 + TypeScript 타입을 생성합니다.

## 사용법

```
/db-model <명령>
```

### 명령 형식

- `/db-model users` — users 테이블 생성
- `/db-model credits --rls` — credits 테이블 + RLS 정책
- `/db-model storage:images` — images Storage 버킷 생성
- `/db-model types` — database.ts 타입만 재생성

## Phase별 실행

### Phase 0: 지식 로드

1. `memory/skills/db-model-lessons.md` 파일을 읽는다 (없으면 skip)
2. `lib/types/database.ts` 현재 상태를 확인한다
3. `supabase/migrations/` 기존 마이그레이션 파일 목록을 확인한다

### Phase 1: 인자 파싱

`$ARGUMENTS`를 분석하여 아래를 결정:
- **mode**: `table` | `storage` | `types`
- **name**: 테이블명 또는 버킷명
- **options**: `--rls` (RLS 포함, 기본값 true), `--no-rls` (RLS 제외)

테이블명이 모호하면 사용자에게 확인을 요청한다.

### Phase 2: 스키마 설계

**테이블 모드 (`table`)**:

1. 테이블의 용도와 관련 도메인을 파악한다
2. 필요한 컬럼을 결정한다:
   - `id` — `uuid DEFAULT gen_random_uuid() PRIMARY KEY`
   - `created_at` — `timestamptz DEFAULT now() NOT NULL`
   - `updated_at` — `timestamptz DEFAULT now() NOT NULL`
   - 도메인별 컬럼
3. 외래키 관계를 설정한다 (기존 테이블 참조)
4. 인덱스를 설계한다

**RLS 정책 규칙**:
- `user_id` 컬럼이 있으면: `auth.uid() = user_id` 기반 정책
- SELECT: 본인 데이터만 조회
- INSERT: 본인 데이터만 생성 (`user_id = auth.uid()`)
- UPDATE: 본인 데이터만 수정
- DELETE: 기본적으로 soft delete 권장, 필요 시 본인만 삭제

**Storage 모드 (`storage`)**:
- 버킷 생성 SQL
- 파일 크기 제한, MIME 타입 제한
- RLS 정책: 본인 폴더(`{user_id}/`)만 접근

### Phase 3: SQL 마이그레이션 생성

파일: `supabase/migrations/{YYYYMMDDHHMMSS}_{name}.sql`

```sql
-- {name} 테이블 생성
-- 생성일: {날짜}

-- 1. 테이블
CREATE TABLE IF NOT EXISTS public.{name} (
  ...
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_{name}_{column} ON public.{name}({column});

-- 3. updated_at 트리거
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_{name}_updated_at
  BEFORE UPDATE ON public.{name}
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. RLS
ALTER TABLE public.{name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{name}_select_own" ON public.{name}
  FOR SELECT USING (auth.uid() = user_id);
-- ... 추가 정책
```

### Phase 4: TypeScript 타입 생성

`lib/types/database.ts`를 업데이트한다:

- 기존 Tables에 새 테이블 타입 추가
- Row, Insert, Update 타입 각각 정의
- 컬럼 타입은 SQL → TypeScript 매핑:
  - `uuid` → `string`
  - `text` → `string`
  - `integer/bigint` → `number`
  - `boolean` → `boolean`
  - `timestamptz` → `string`
  - `jsonb` → `Record<string, unknown>`
  - `enum` → string union

### Phase 5: 검증

1. SQL 파일 문법 확인 (세미콜론, 괄호 매칭)
2. 외래키 참조 테이블 존재 여부 확인
3. TypeScript 타입과 SQL 컬럼 일치 확인
4. `yarn build` 실행하여 타입 에러 없는지 확인

### Phase 6: 지식 저장

실행 중 발생한 교훈을 `memory/skills/db-model-lessons.md`에 기록:
- 새로운 패턴 발견 시
- 에러 수정 경험
- 스키마 설계 결정 사유

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```

## 출력

실행 완료 후 아래를 출력:
1. 생성된 파일 목록
2. SQL 요약 (테이블/컬럼/정책)
3. 다음 단계 안내 (`Supabase Dashboard에서 SQL 실행` 또는 `supabase db push`)
