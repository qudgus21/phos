# Polar Integration Guide

## 1. Checkout (결제)

### 방식 1: Checkout Links (공유 링크)
SNS, 이메일 등 외부 공유용. 링크 클릭 시 checkout 세션 자동 생성.

```bash
POST /v1/checkout-links/
```
- `products` — 상품 ID 배열
- `return_url` — 결제 후 리다이렉트 URL
- `discount_id` — 할인 코드 (선택)
- UTM 파라미터 지원 (`utm_source`, `utm_medium`, `utm_campaign`)

> 앱 내부 결제에는 Checkout Sessions API를 사용할 것.

### 방식 2: Checkout Sessions API (앱 내부 결제)
단발성 checkout 세션 생성. **가장 일반적인 방식.**

```typescript
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox" // or "production"
});

const checkout = await polar.checkouts.createSession({
  products: [{ id: "prod_123" }],
  customerEmail: "user@example.com",
  returnUrl: "https://yourapp.com/success"
});

// checkout.url → 결제 페이지 URL
// checkout.clientSecret → 클라이언트 사이드용
```

**주요 파라미터:**
- `products` — 상품 배열 (ad-hoc 가격 오버라이드 가능)
- `customer_email` — 이메일 프리필
- `external_customer_id` — 외부 시스템 사용자 ID 연동
- `discount_id` — 할인 적용
- `custom_fields` — 추가 정보 수집
- `return_url` — 결제 완료 후 리다이렉트
- `allow_trial` — 체험 비활성화 옵션

**클라이언트 사이드 조작:**
```bash
GET  /v1/checkouts/client/{client_secret}
PATCH /v1/checkouts/client/{client_secret}
POST /v1/checkouts/client/{client_secret}/confirm
```

### 방식 3: Embedded Checkout
컴포넌트를 통해 페이지 내 임베드.

---

## 2. Webhook (이벤트 수신)

### 이벤트 종류

| 이벤트 | 설명 | 용도 |
|--------|------|------|
| `checkout.created` | 체크아웃 시작 | 추적 |
| `checkout.updated` | 체크아웃 상태 변경 | 추적 |
| `order.created` | 주문 생성 | 참고용 (결제 전) |
| `order.paid` | **결제 완료** | **크레딧 충전, 구독 활성화** |
| `order.updated` | 주문 변경/환불 | 환불 처리 |
| `subscription.created` | 구독 생성 | 구독 시작 처리 |
| `subscription.active` | 구독 활성 | 상태 확인 |
| `subscription.updated` | 구독 변경 | 플랜 변경 처리 |
| `subscription.canceled` | 구독 취소 | 구독 종료 처리 |
| `customer.created` | 고객 생성 | 사용자 연동 |
| `customer.state_changed` | 고객 상태 변경 | 종합 상태 업데이트 |

> **중요:** 결제 확인은 `order.created`가 아닌 **`order.paid`** 를 사용할 것.

### 서명 검증
Standard Webhooks 스펙 사용 (HMAC-SHA256).

```typescript
// app/api/webhook/polar/route.ts
import { validateWebhookSignature } from "@polar-sh/sdk/webhooks";

export async function POST(req: Request) {
  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id"),
    "webhook-timestamp": req.headers.get("webhook-timestamp"),
    "webhook-signature": req.headers.get("webhook-signature"),
  };

  const event = validateWebhookSignature(
    body,
    headers,
    process.env.POLAR_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "order.paid":
      // 크레딧 충전 또는 구독 활성화
      break;
    case "subscription.canceled":
      // 구독 종료 처리
      break;
  }

  return Response.json({ received: true });
}
```

### 주의사항
- 10회 연속 실패 시 webhook 자동 비활성화
- 멱등성 처리 필수 (event ID로 중복 방지)
- 실패 시 조직 멤버에게 이메일 알림

---

## 3. Customer Portal (고객 포털)

서버에서 고객 세션을 생성하고, 클라이언트에서 포털 접근.

### 세션 생성 (서버)
```typescript
const session = await polar.customerSessions.create({
  customerId: "cus_123",
  returnUrl: "https://yourapp.com/return"
});

// session.customerAccessToken → 클라이언트에 전달
```

### 고객이 할 수 있는 것
- 주문 내역 조회, 영수증 다운로드
- 구독 관리 (플랜 변경, 취소)
- 결제 수단 변경
- 라이선스 키 관리
- 팀 멤버 관리 (B2B)
- 혜택 조회, 파일 다운로드

### 포털 기능 토글 (대시보드 Settings → Subscriptions)
대시보드에서 포털에 노출할 기능을 개별 ON/OFF 가능:
- **Show metered usage** — 사용량 표시 (API는 영향 없음)
- **Enable subscription seat management** — 좌석 관리 허용
- **Enable subscription plan changes** — 플랜 변경 허용 (**OFF 시 Change plan 버튼 숨김**)

> 참고: https://polar.sh/docs/guides/disable-subscription-changes-in-customer-portal

### 포털 API 엔드포인트 (Customer Access Token 필요)
```bash
GET    /v1/customer-portal/orders/
GET    /v1/customer-portal/subscriptions/
PATCH  /v1/customer-portal/subscriptions/{id}
DELETE /v1/customer-portal/subscriptions/{id}
GET    /v1/customer-portal/license-keys/
POST   /v1/customer-portal/license-keys/validate
```

---

## 4. Next.js 통합

### SDK 설치
```bash
npm install @polar-sh/sdk
```

### Polar 클라이언트 초기화
```typescript
// lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox"
});
```

### Webhook Route Handler
```typescript
// app/api/webhook/polar/route.ts
export async function POST(req: Request) {
  // 위 webhook 섹션 참조
}
```

### Better Auth 통합 (선택)
```typescript
import { betterAuth } from "better-auth";
import { polar } from "@polar-sh/better-auth";

const auth = betterAuth({
  plugins: [
    polar({ accessToken: process.env.POLAR_ACCESS_TOKEN })
  ]
});
```

---

## 5. 환경변수

```bash
# 필수
POLAR_ACCESS_TOKEN=polar_oat_xxxxx     # Organization Access Token

# 웹훅 사용 시
POLAR_WEBHOOK_SECRET=polar_whs_xxxxx   # Webhook Signing Secret

# 상품 ID (sandbox/production 별도)
POLAR_PRODUCT_BASIC=xxx
POLAR_PRODUCT_PRO=xxx
POLAR_PRODUCT_PREMIUM=xxx
POLAR_PRODUCT_CREDIT_700=xxx
# ...
```
