# Polar MCP 사용 가이드

## 환경 구분

| MCP | 용도 | API 서버 |
|-----|------|----------|
| `mcp__Polar__*` | Production (운영) | api.polar.sh |
| `mcp__Polar-Sandbox__*` | Sandbox (개발/테스트) | sandbox-api.polar.sh |

> 기본적으로 **Sandbox** 사용. 운영 데이터 조작 시에만 Production 사용하고, 반드시 사용자에게 확인받을 것.

---

## MCP 도구 3종

### 1. search_tools — 도구 검색
사용 가능한 도구를 자연어로 검색.

```
mcp__Polar-Sandbox__search_tools
  query: "list products"
  num_results: 5
  tags: ["polar/products"]  # 선택
```

**사용 가능한 태그:**
`polar/products`, `polar/checkouts`, `polar/orders`, `polar/subscriptions`, `polar/customers`, `polar/customer_meters`, `polar/payments`, `polar/webhooks`, `polar/metrics`, `polar/mcp`, `polar/public`

### 2. describe_tools — 도구 상세 확인
도구의 입력 스키마(파라미터)를 확인. **execute 전에 반드시 호출.**

```
mcp__Polar-Sandbox__describe_tools
  tool_names: ["polar_products_list"]
```

### 3. execute_tool — 도구 실행
실제 API 호출.

```
mcp__Polar-Sandbox__execute_tool
  name: "polar_products_list"
  arguments: {}
```

---

## 워크플로우: describe → execute

MCP 도구를 처음 사용할 때는 항상 이 순서를 따른다:

```
1. search_tools → 필요한 도구 이름 찾기
2. describe_tools → 파라미터 스키마 확인
3. execute_tool → 실행
```

이미 사용해본 도구는 2-3번만 수행.

---

## 자주 쓰는 도구 & 예시

### 상품 관리

**상품 목록 조회:**
```
execute_tool
  name: "polar_products_list"
  arguments: {}
```

**구독 상품만 조회:**
```
execute_tool
  name: "polar_products_list"
  arguments: { "queryParameters": { "is_recurring": true } }
```

**일회성 상품만 조회:**
```
execute_tool
  name: "polar_products_list"
  arguments: { "queryParameters": { "is_recurring": false } }
```

### 주문/결제

**주문 목록:**
```
execute_tool
  name: "polar_orders_list"
  arguments: {}
```

**결제 목록:**
```
execute_tool
  name: "polar_payments_list"
  arguments: {}
```

### 구독

**활성 구독 목록:**
```
execute_tool
  name: "polar_subscriptions_list"
  arguments: {}
```

### 고객

**고객 목록:**
```
execute_tool
  name: "polar_customers_list"
  arguments: {}
```

### 웹훅

**웹훅 엔드포인트 생성:**
```
execute_tool
  name: "polar_webhooks_create_webhook_endpoint"
  arguments: {
    "body": {
      "url": "https://example.com/api/webhook/polar",
      "name": "My Webhook",
      "format": "raw",
      "events": ["order.paid", "subscription.created", "subscription.canceled"]
    }
  }
```

**웹훅 배달 내역 확인:**
```
execute_tool
  name: "polar_webhooks_list_webhook_deliveries"
  arguments: {}
```

### 메트릭

**매출/구독 메트릭:**
```
execute_tool
  name: "polar_metrics_get"
  arguments: {
    "queryParameters": {
      "start_date": "2026-01-01",
      "end_date": "2026-03-31"
    }
  }
```

> 메트릭 금액은 센트 단위 (예: 2900 = $29.00)

---

## 주의사항

1. **describe 먼저**: execute 전에 항상 describe로 스키마 확인
2. **Sandbox 기본**: 특별한 지시 없으면 Sandbox MCP 사용
3. **Production 주의**: 운영 데이터 수정/삭제 시 사용자 확인 필수
4. **Rate Limit**: Sandbox는 100 req/min, Production은 500 req/min
5. **금액 단위**: 모든 금액은 센트 (price_amount: 2900 = $29.00)
