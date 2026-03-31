---
name: polar
description: Polar 결제 연동 — 체크아웃, 웹훅, 고객포털, 구독/크레딧 관리. Polar API/SDK/MCP 활용. 결제, 구독, 상품, checkout, webhook, payment, subscription, credit 관련 작업 시 자동 트리거.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(yarn *), Bash(npx *), Bash(npm *), Bash(git *), Bash(ngrok *), Bash(curl *), WebFetch, mcp__Polar__*, mcp__Polar-Sandbox__*
user-invocable: true
---

# Polar 결제 전문가

Polar 결제 플랫폼 연동 전문가로서, 체크아웃/웹훅/고객포털/구독/크레딧 관련 작업을 수행한다.

---

## Phase 0: 지식 로드

스킬 시작 시 bundled references를 읽는다:

1. `references/integration-guide.md` — 체크아웃, 웹훅, 고객포털 연동 패턴
2. `references/api-patterns.md` — 인증, SDK, 엔드포인트, 에러 핸들링
3. `references/mcp-guide.md` — MCP 도구 사용법 (Production/Sandbox)

> 문서가 오래되었거나 상세 정보가 필요하면 `WebFetch`로 `https://polar.sh/docs/llms-full.txt` 참조.

---

## Phase 1: 요청 분류

사용자 요청을 분류한다:

| 분류 | 예시 |
|------|------|
| **체크아웃** | "결제 페이지 만들어줘", "checkout 연동" |
| **웹훅** | "webhook 핸들러 만들어줘", "결제 완료 이벤트 처리" |
| **고객포털** | "구독 관리 페이지", "고객 포털 연동" |
| **상품 관리** | "상품 조회", "가격 변경", "새 상품 추가" |
| **구독/크레딧** | "구독 상태 확인", "크레딧 충전 로직" |
| **데이터 조회** | "매출 확인", "주문 내역", "고객 목록" |
| **설정** | "웹훅 등록", "환경변수 설정", "ngrok" |

---

## Phase 2: 문서 참조 (필요 시)

references에 없는 상세 정보가 필요한 경우 실행:

```
1차: WebFetch: https://polar.sh/docs/llms-full.txt  (API 레퍼런스)
2차: WebFetch: https://polar.sh/docs                 (가이드/튜토리얼 목록)
```

**중요: `llms-full.txt`에만 의존하지 말 것.** Polar docs는 API 레퍼런스 외에 `/docs/guides/` 하위에 설정 가이드가 별도로 존재한다. "불가능하다/없다"고 단언하기 전에 반드시 guides 섹션까지 확인할 것.

**참조가 필요한 상황:**
- 새로운 API 엔드포인트 사용
- SDK 메서드의 정확한 파라미터 확인
- 최신 변경사항 확인
- references에 없는 기능 (Discounts, Refunds, License Keys 등)
- 대시보드 설정 관련 (포털 커스터마이징, proration 설정 등)

---

## Phase 3: MCP 환경 판단

### 기본 규칙
- **별도 지시 없으면 → Sandbox** (`mcp__Polar-Sandbox__*`)
- **"운영", "프로덕션", "production" 언급 시 → Production** (`mcp__Polar__*`)
- **Production에서 수정/삭제 시 → 사용자 확인 필수**

### MCP 사용 워크플로우
```
1. search_tools → 도구 이름 찾기
2. describe_tools → 파라미터 스키마 확인 (첫 사용 시)
3. execute_tool → 실행
```

### 자주 쓰는 도구 (describe 생략 가능)
- `polar_products_list` — 상품 목록
- `polar_orders_list` — 주문 목록
- `polar_subscriptions_list` — 구독 목록
- `polar_customers_list` — 고객 목록
- `polar_payments_list` — 결제 목록
- `polar_metrics_get` — 매출/구독 메트릭
- `polar_webhooks_create_webhook_endpoint` — 웹훅 등록
- `polar_webhooks_list_webhook_deliveries` — 웹훅 배달 내역

---

## Phase 4: 실행

요청에 맞는 작업을 수행한다.

### 코드 생성 시 규칙

1. **SDK 사용**: `@polar-sh/sdk` 패키지 사용
2. **환경변수 참조**: `.env.local`의 `POLAR_*` 변수 사용
3. **서버 환경 판단**:
   ```typescript
   server: process.env.NODE_ENV === "production" ? "production" : "sandbox"
   ```
4. **금액 단위**: 센트 (2900 = $29.00)
5. **에러 핸들링**: statusCode 기반 (401, 422, 429)

### API 라우트 생성 시
- `app/api/webhook/polar/route.ts` — 웹훅 핸들러
- `app/api/checkout/route.ts` — 체크아웃 세션 생성
- `app/api/portal/route.ts` — 고객 포털 세션 생성

### MCP로 데이터 조회 시
- 결과를 읽기 쉬운 테이블 형태로 정리
- 금액은 센트 → 달러 변환하여 표시

---

## Phase 5: 검증

코드를 생성/수정한 경우:

1. **타입 체크**: `yarn tsc --noEmit` (프로젝트에 TypeScript 있을 때)
2. **빌드 확인**: `yarn build` (필요 시)
3. **MCP 테스트**: Sandbox MCP로 실제 API 호출 테스트

---

## 참고: Phos 프로젝트 상품 구성

### 구독 (월간)
- Basic: $9/월
- Pro: $19/월
- Premium: $29/월

### 크레딧 (일회성)
- 700 Credit: $5
- 1500 Credit: $10
- 2400 Credit: $15
- 3300 Credit: $20
- 5100 Credit: $30

> 상품 ID는 `.env.local`의 `POLAR_PRODUCT_*` 환경변수 참조.
