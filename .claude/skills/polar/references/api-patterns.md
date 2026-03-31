# Polar API Patterns

## 인증

### Organization Access Token (OAT)
서버 사이드 전용. 클라이언트에 노출 금지.

```typescript
// Authorization: Bearer polar_oat_xxxxx
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: "sandbox" // or "production"
});
```

### Customer Access Token
고객 포털용. 서버에서 세션 생성 후 클라이언트에 전달.

```typescript
const session = await polar.customerSessions.create({
  customerId: "cus_123"
});
// session.customerAccessToken → 클라이언트 전달 (polar_cst_xxxxx)
```

### 토큰 스코프
| 스코프 | 설명 |
|--------|------|
| `products:read/write` | 상품 관리 |
| `checkouts:write` | 체크아웃 생성 |
| `checkout_links:write` | 체크아웃 링크 생성 |
| `orders:read/write` | 주문 관리 |
| `subscriptions:read/write` | 구독 관리 |
| `customers:read/write` | 고객 관리 |
| `benefits:read/write` | 혜택 관리 |
| `webhooks:write` | 웹훅 관리 |

---

## 주요 엔드포인트

### Products (상품)
```bash
GET    /v1/products                    # 목록 조회
POST   /v1/products                    # 생성
GET    /v1/products/{id}               # 단건 조회
PATCH  /v1/products/{id}               # 수정
```

### Checkouts (결제)
```bash
POST   /v1/checkouts/                  # 세션 생성
GET    /v1/checkouts/{id}              # 조회
GET    /v1/checkouts/client/{secret}   # 클라이언트 조회
PATCH  /v1/checkouts/client/{secret}   # 클라이언트 수정
POST   /v1/checkouts/client/{secret}/confirm  # 확인
```

### Checkout Links (공유 링크)
```bash
POST   /v1/checkout-links/             # 생성
GET    /v1/checkout-links/             # 목록
PATCH  /v1/checkout-links/{id}         # 수정
DELETE /v1/checkout-links/{id}         # 삭제
```

### Orders (주문)
```bash
GET    /v1/orders                      # 목록
GET    /v1/orders/{id}                 # 단건
GET    /v1/orders/{id}/invoice         # 영수증
```

### Subscriptions (구독)
```bash
GET    /v1/subscriptions               # 목록
GET    /v1/subscriptions/{id}          # 단건
PATCH  /v1/subscriptions/{id}          # 수정 (플랜 변경)
DELETE /v1/subscriptions/{id}          # 취소
```

### Customers (고객)
```bash
GET    /v1/customers                   # 목록
POST   /v1/customers                   # 생성
GET    /v1/customers/{id}              # 단건
PATCH  /v1/customers/{id}              # 수정
DELETE /v1/customers/{id}              # 삭제
GET    /v1/customers/{id}/state        # 상태 (구독+혜택 종합)
GET    /v1/customers/external/{id}/state  # 외부ID로 상태 조회
```

### Customer Sessions (고객 세션)
```bash
POST   /v1/customer-sessions/          # 세션 생성 → 포털 접근용 토큰 발급
```

### Webhooks
```bash
POST   /v1/webhooks/endpoints          # 엔드포인트 생성
GET    /v1/webhooks/endpoints          # 목록
PATCH  /v1/webhooks/endpoints/{id}     # 수정
DELETE /v1/webhooks/endpoints/{id}     # 삭제
GET    /v1/webhooks/deliveries         # 배달 내역
```

---

## SDK 주요 메서드

### TypeScript SDK
```bash
npm install @polar-sh/sdk
```

```typescript
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: "sandbox"
});

// 상품 목록
const products = await polar.products.list({ limit: 100 });

// 체크아웃 생성
const checkout = await polar.checkouts.createSession({
  products: [{ id: "prod_xxx" }],
  customerEmail: "user@example.com",
  returnUrl: "https://app.com/success"
});

// 고객 상태 조회 (구독 + 혜택)
const state = await polar.customers.getStateByExternalId({
  externalId: "user_123"
});

// 주문 목록
const orders = await polar.orders.list({ page: 1, limit: 100 });

// 구독 취소
await polar.subscriptions.cancel({ id: "sub_xxx" });

// 고객 포털 세션
const session = await polar.customerSessions.create({
  customerId: "cus_xxx",
  returnUrl: "https://app.com"
});
```

---

## 페이지네이션

모든 목록 API는 동일한 페이지네이션 구조:

```typescript
const result = await polar.orders.list({ page: 1, limit: 50 });

// result.items — 데이터 배열
// result.pagination.total_count — 전체 개수
// result.pagination.max_page — 최대 페이지
```

---

## Rate Limits

| 환경 | 제한 |
|------|------|
| Production | 500 req/min (조직당) |
| Sandbox | 100 req/min (조직당) |
| 비인증 (라이선스 검증 등) | 3 req/sec |

`Retry-After` 헤더로 재시도 타이밍 확인 가능.

---

## 에러 핸들링

```typescript
try {
  const checkout = await polar.checkouts.createSession({ ... });
} catch (error) {
  if (error.statusCode === 422) {
    // Validation error
  } else if (error.statusCode === 429) {
    // Rate limit — Retry-After 헤더 확인
  } else if (error.statusCode === 401) {
    // 인증 실패
  }
}
```

---

## 문서 참조
- 전체 API 문서: https://polar.sh/docs/llms-full.txt
- SDK 소스: https://github.com/polarsource/polar
