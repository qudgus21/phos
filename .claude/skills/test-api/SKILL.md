# test-api — API 테스트 실행기

API Route Handler를 분석하고 4가지 시나리오로 자동 테스트합니다.

## 사용법

```
/test-api <명령>
```

### 명령 형식

- `/test-api POST /api/image/upscale` — 특정 엔드포인트 테스트
- `/test-api GET /api/credits` — GET 엔드포인트 테스트
- `/test-api all /api/image/upscale` — 해당 경로의 모든 메서드 테스트
- `/test-api all` — 전체 API 엔드포인트 테스트

## 전제 조건

- `.env.local`에 Supabase 환경변수 설정 완료
- Supabase 프로젝트에 테스트용 사용자 존재
- 로컬 개발 서버 실행 중 (`yarn dev`) 또는 실행 가능

## Phase별 실행

### Phase 0: 지식 + 환경 확인

1. `memory/skills/test-api-lessons.md` 파일을 읽는다 (없으면 skip)
2. `.env.local` 파일에서 Supabase URL과 키를 확인한다
3. 환경변수가 없으면 사용자에게 안내하고 중단한다

### Phase 1: 인자 파싱

`$ARGUMENTS`를 분석:
- **method**: HTTP 메서드 (`GET`, `POST`, `PATCH`, `DELETE`, `all`)
- **path**: API 경로 (예: `/api/image/upscale`)
- `all`만 지정 시: `app/api/` 하위 모든 route.ts를 스캔

### Phase 2: 엔드포인트 분석

대상 `route.ts` 파일을 읽어서 분석:
1. export된 메서드 함수 목록 (GET, POST 등)
2. `withAuth` 사용 여부 → 인증 필요 여부
3. Zod 스키마 import 확인 → 필수/선택 필드 파악
4. 해당 Zod 스키마 파일을 읽어 필드 타입과 제약 조건 확인
5. 크레딧 차감 로직 존재 여부 확인

분석 결과를 정리:
```
엔드포인트: POST /api/image/upscale
인증: 필요
필수 필드: { image: string, scale: number }
선택 필드: { format: "png" | "jpeg" }
크레딧: 10
```

### Phase 3: 토큰 획득

Supabase Auth로 테스트 토큰을 획득:

```bash
curl -s -X POST "{SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
```

토큰 획득 실패 시:
1. 사용자에게 테스트 계정 생성 안내
2. 또는 `.env.local`에 `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` 설정 안내

### Phase 4: 테스트 실행

4가지 시나리오를 순서대로 실행:

**시나리오 1: 정상 요청 (200)**
```bash
curl -s -w "\n%{http_code}\n%{time_total}" \
  -X {METHOD} "http://localhost:3000{path}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{valid_body}'
```

**시나리오 2: 인증 없음 (401)**
```bash
curl -s -w "\n%{http_code}" \
  -X {METHOD} "http://localhost:3000{path}" \
  -H "Content-Type: application/json" \
  -d '{valid_body}'
```
- `withAuth` 미사용 엔드포인트면 skip

**시나리오 3: 잘못된 입력 (400)**
```bash
curl -s -w "\n%{http_code}" \
  -X {METHOD} "http://localhost:3000{path}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{invalid_body}'
```
- 필수 필드 누락, 타입 불일치, 범위 초과 등

**시나리오 4: 크레딧 부족 (402)**
- 크레딧 차감 로직이 없는 엔드포인트면 skip
- 크레딧을 0으로 설정 후 요청 (또는 크레딧 부족 상태 시뮬레이션)

### Phase 5: 결과 리포트

결과를 테이블 형식으로 출력:

```
┌─────────────────┬────────┬──────────┬──────────┬─────────┐
│ 시나리오         │ 예상   │ 실제     │ 결과     │ 응답시간 │
├─────────────────┼────────┼──────────┼──────────┼─────────┤
│ 정상 요청       │ 200    │ 200      │ PASS ✓   │ 120ms   │
│ 인증 없음       │ 401    │ 401      │ PASS ✓   │ 15ms    │
│ 잘못된 입력     │ 400    │ 400      │ PASS ✓   │ 18ms    │
│ 크레딧 부족     │ 402    │ 402      │ PASS ✓   │ 45ms    │
└─────────────────┴────────┴──────────┴──────────┴─────────┘
```

추가 정보:
- 각 시나리오의 응답 body 샘플
- 실패 시 원인 분석 및 수정 제안
- 전체 평균 응답 시간

### Phase 6: 지식 저장

실행 중 발생한 교훈을 `memory/skills/test-api-lessons.md`에 기록.

형식:
```markdown
### {번호}. {제목}
- **상황**: {어떤 상황에서}
- **교훈**: {무엇을 배웠는지}
- **날짜**: {YYYY-MM-DD}
```

## 에러 처리

| 상황 | 대응 |
|------|------|
| 서버 미실행 | "로컬 서버가 실행 중이 아닙니다. `yarn dev`로 먼저 시작해주세요." |
| 토큰 만료 | 자동으로 토큰 재발급 |
| 타임아웃 (10초 초과) | 타임아웃으로 기록, 성능 경고 출력 |
| 500 에러 | 서버 로그 확인 안내, route.ts 코드 분석하여 원인 추정 |
