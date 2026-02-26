# db — Supabase 데이터 조회/관리

Supabase 원격 DB에 자주 쓰는 쿼리를 빠르게 실행합니다.

## 사용법

```
/db <명령>
```

## 프로젝트 정보

- **project_id**: `ltqzuqvjbiecbjdqgjge`

## 지원 명령어

### 유저 관련

| 명령 | 설명 |
|------|------|
| `/db 유저 목록` | 전체 유저 목록 (public.users + credits 조인) |
| `/db 유저 조회 <email>` | 특정 유저 상세 정보 |
| `/db 유저 삭제 <email>` | 특정 유저 삭제 (auth.users + public.users CASCADE) |
| `/db 모든 유저 삭제` | 전체 유저 삭제 (**확인 필수**) |

### 크레딧 관련

| 명령 | 설명 |
|------|------|
| `/db 크레딧 조회 <email>` | 특정 유저의 크레딧 잔액 |
| `/db 크레딧 설정 <email> <amount>` | 특정 유저 크레딧 금액 설정 |
| `/db 크레딧 추가 <email> <amount>` | 특정 유저 크레딧 증가 |

### 일반

| 명령 | 설명 |
|------|------|
| `/db 테이블 목록` | public 스키마 테이블 목록 |
| `/db sql <쿼리>` | 임의 SQL 직접 실행 |

## 실행 규칙

### Phase 0: 인터랙티브 메뉴 (인자 없이 `/db`만 실행한 경우)

`$ARGUMENTS`가 비어있으면 `AskUserQuestion` 도구로 메뉴를 보여준다:

**1차 질문** — 카테고리 선택:
- header: "DB 작업"
- options:
  - "유저 관리" — 유저 조회/삭제
  - "크레딧 관리" — 크레딧 조회/설정/추가
  - "테이블 목록" — public 스키마 테이블 확인
  - "SQL 직접 실행" — 임의 쿼리 입력

**2차 질문** — 카테고리별 세부 선택:

유저 관리 선택 시:
- "유저 목록" — 전체 유저 + 크레딧 조회
- "유저 조회" — 이메일로 특정 유저 검색
- "유저 삭제" — 특정 유저 삭제
- "모든 유저 삭제" — 전체 삭제

크레딧 관리 선택 시:
- "크레딧 조회" — 특정 유저 잔액 확인
- "크레딧 설정" — 특정 유저 잔액 변경
- "크레딧 추가" — 특정 유저 잔액 증가

**3차** — 이메일/금액 등 추가 입력이 필요하면 `AskUserQuestion`으로 입력받는다.

### Phase 1: 명령 파싱 (인자가 있는 경우)

`$ARGUMENTS`를 분석하여 어떤 쿼리를 실행할지 결정한다. 인자가 있으면 Phase 0을 건너뛰고 바로 실행한다.

### Phase 2: 쿼리 매핑

명령에 따라 아래 SQL을 `execute_sql` MCP 도구로 실행한다.

**유저 목록**:
```sql
SELECT u.id, u.email, u.name, u.auth_provider, u.created_at, c.balance as credits
FROM public.users u
LEFT JOIN public.user_credits c ON c.user_id = u.id
ORDER BY u.created_at DESC;
```

**유저 조회 <email>**:
```sql
SELECT u.*, c.balance as credits
FROM public.users u
LEFT JOIN public.user_credits c ON c.user_id = u.id
WHERE u.email = '<email>';
```

**유저 삭제 <email>**:
- 삭제 전 반드시 사용자에게 확인을 받는다
- `auth.users`에서 삭제하면 `public.users`와 `user_credits`는 CASCADE로 자동 삭제
```sql
DELETE FROM auth.users WHERE email = '<email>';
```

**모든 유저 삭제**:
- **반드시** 사용자에게 "정말 전체 유저를 삭제하시겠습니까?" 확인을 받는다
- 확인 후 실행:
```sql
DELETE FROM auth.users;
```

**크레딧 조회 <email>**:
```sql
SELECT u.email, u.name, c.balance
FROM public.users u
JOIN public.user_credits c ON c.user_id = u.id
WHERE u.email = '<email>';
```

**크레딧 설정 <email> <amount>**:
```sql
UPDATE public.user_credits SET balance = <amount>, updated_at = now()
WHERE user_id = (SELECT id FROM public.users WHERE email = '<email>');
```

**크레딧 추가 <email> <amount>**:
```sql
UPDATE public.user_credits SET balance = balance + <amount>, updated_at = now()
WHERE user_id = (SELECT id FROM public.users WHERE email = '<email>');
```

**테이블 목록**:
`list_tables` MCP 도구를 사용한다 (schemas: ["public"]).

**sql <쿼리>**:
사용자가 입력한 SQL을 그대로 `execute_sql`로 실행한다.

### Phase 3: 결과 출력

- 결과를 보기 좋은 테이블 형태로 정리하여 출력한다
- 삭제 작업의 경우 삭제된 건수를 명시한다
- 에러 발생 시 원인과 해결 방법을 안내한다

## 주의사항

- 삭제 명령(`유저 삭제`, `모든 유저 삭제`)은 실행 전 반드시 사용자 확인
- `execute_sql`만 사용한다 (DDL은 `/db-model` 스킬 담당)
- 이 스킬은 데이터 조회/수정 전용, 스키마 변경은 절대 하지 않는다
