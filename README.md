<div align="center">

<img src="public/images/og/hero-model.jpg" alt="Phos — Photorealistic AI Image Studio" width="100%" />

# Phos

### Photorealistic AI image retouching, face editing & generation

**Production SaaS** built solo — payments, AI generation, realtime credit system, all in one.

[**Live →  phos.studio**](https://phos.studio)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)
![Polar](https://img.shields.io/badge/Polar-MoR%20Payment-FF6B35)
![Vercel](https://img.shields.io/badge/Vercel-Production-black?logo=vercel)

</div>

---

## What it does

Phos turns ordinary product or model photos into studio-grade commercial images using AI — without hiring a retoucher. It targets e-commerce sellers, marketers, and designers who need photorealistic output (not anime/illustration).

Three independent tools, one credit wallet:

| Tool | What it does | Engine | Cost |
|------|--------------|--------|------|
| 🪞 **Skin Retouching** | Pro-grade skin & face refinement with mode/filter controls | Flux Pro 1.1 | 80 credits |
| 🎭 **Face Editing** | Mask-based face replacement / transformation | FLUX Fill Pro | 85 credits |
| 🖼️ **Image Generation** | Text + multi-reference image composition | Nano Banana Pro / SeedDream 5.0 | 75–150 credits |

<details>
<summary><strong>See sample outputs →</strong></summary>

<table>
<tr>
<td align="center"><strong>Skin Retouching</strong><br><sub>before → after</sub></td>
<td align="center"><strong>Face Editing</strong><br><sub>mask-based replacement</sub></td>
<td align="center"><strong>Image Generation</strong><br><sub>reference composition</sub></td>
</tr>
<tr>
<td><img src="public/images/retouching/sample1/before.webp" width="280"/><br><img src="public/images/retouching/sample1/after.webp" width="280"/></td>
<td><img src="public/images/face-edit/sample1/before.webp" width="280"/><br><img src="public/images/face-edit/sample1/after.webp" width="280"/></td>
<td><img src="public/images/image-edit/sample1/input1.webp" width="280"/><br><img src="public/images/image-edit/sample1/output1.webp" width="280"/></td>
</tr>
</table>

</details>

---

## Engineering highlights

What makes this more than a thin AI wrapper:

#### 🧮 Atomic credit system with realtime sync
- Pre-deduct → generate → refund-on-failure pattern via Postgres RPC (`deduct_credits`, `refund_credits`)
- Dual-balance ledger (`onetime_balance` + `subscription_balance`) with deterministic deduction order
- Supabase Realtime → React Query cache invalidation: balance updates without polling
- **Hard rule: paid credits never expire**, even on cancellation or downgrade

#### 💳 Polar (Merchant of Record) payment integration
- Full subscription lifecycle: signup, upgrade (immediate, prorated), downgrade (scheduled), cancel/uncancel, revoke, refund
- Webhook handler with **signature verification + idempotency by `webhook_id`** (handles duplicate deliveries)
- Proportional credit recalculation on mid-cycle upgrades
- 60s TTL cache to prevent double-click checkout duplicates

#### 🤖 Multi-provider AI abstraction
- Provider/Model registry pattern (factory + singleton cache) in `lib/services/ai/registry.ts`
- Adding a new AI service = implementing `AIProvider` interface + registering in models.ts
- Supports Replicate (polling) and BytePlus Ark; Stability stubbed for future
- Per-model prompt builders keep model-specific quirks isolated

#### 🎨 Custom canvas mask editor
- Pure Canvas API + custom `useMaskCanvas` hook — no external library
- Undo/Redo (30-step history), draw / erase / rectangle tools, brush size control
- 1:1 pixel mapping (CSS size = canvas resolution) for precise mask export as PNG blob

#### 🔒 Supabase RLS-first security
- Row-level security policies for every user-owned table (`users`, `user_credits`, `generation_history`, `favorites`)
- Service-role admin client strictly separated; never used in user-context request paths
- `withAuth()` / `withAdminAuth()` HOFs enforce auth at API route boundary

#### ⚡ Performance
- Lighthouse all-green via font subsetting, dynamic imports, redirect elimination, WebP
- `loading="eager"` + `fetchPriority="high"` only on LCP image
- Cookie-aware caching strategy in middleware

---

## Tech stack

| Layer | Stack |
|-------|-------|
| **Framework** | Next.js 15 (App Router, RSC) · React 18 · TypeScript 5 (strict) |
| **UI** | Tailwind CSS 3 · Framer Motion 12 · Lucide |
| **Server state** | TanStack Query v5 · Zod 4 |
| **DB / Auth / Storage** | Supabase (Postgres + Auth + Storage + Realtime) |
| **Payments** | Polar SDK (`@polar-sh/sdk`) — MoR |
| **AI** | Replicate · BytePlus Ark (multi-provider abstraction) |
| **Email** | Resend |
| **i18n** | Korean + English (en-first copy strategy) |
| **Testing** | Vitest · Playwright |
| **Hosting** | Vercel (auto-deploy from `main`) |

---

## Architecture deep-dives

<details>
<summary><strong>Credit deduction flow (atomic, refundable)</strong></summary>

```
1. User clicks Generate
2. API route calls deduct_credits RPC  → row-locked atomic decrement
   ├─ insufficient balance? → 402 Payment Required
   └─ on cooldown?           → 429 Too Many Requests
3. Call AI provider (Replicate / BytePlus)
   ├─ success → insert generation_history → return URLs
   └─ failure → refund_credits RPC (restore balance)
4. Supabase Realtime broadcasts user_credits change
5. Client React Query invalidates → UI updates without polling
```

Implemented in [`lib/services/credits/index.ts`](lib/services/credits/index.ts) and `supabase/migrations/005_create_credit_rpc_functions.sql`.

</details>

<details>
<summary><strong>Polar webhook idempotency & subscription state machine</strong></summary>

- Every webhook persists `webhook_id` to `webhook_events` table before processing.
- Duplicate `webhook_id` → 200 OK, skip processing.
- Order/subscription state mutations go through Postgres RPCs (`process_subscription_activation`, `process_credit_purchase`, `process_refund`, `process_subscription_revoke`) — single source of truth.
- Mid-cycle upgrade: prorated credit grant via `period_credits_granted` tracking.
- Downgrade: stored as `scheduled_plan_id`, applied at next renewal.

Webhook handler in [`app/api/webhook/polar/route.ts`](app/api/webhook/polar/route.ts).

</details>

<details>
<summary><strong>AI provider registry pattern</strong></summary>

```ts
// lib/services/ai/types.ts
interface AIProvider {
  generate(input: GenerationInput): Promise<GenerationResult>;
}

// lib/services/ai/registry.ts
const providers = new Map<string, AIProvider>();
export function getProvider(name: ProviderName): AIProvider { ... }
export function resolveProvider(modelId: string): AIProvider { ... }

// lib/services/ai/models.ts
export const IMAGE_EDIT_MODELS: ModelDef[] = [
  { id: "nano-banana-pro", provider: "replicate", ... },
  { id: "seedream-5", provider: "replicate", ... },
];
```

Adding a new provider = implement interface, register, done. Prompt builders are model-specific so each model's quirks stay isolated.

</details>

---

## Project structure

<details>
<summary>Click to expand</summary>

```
phos/
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── checkout/                 # Polar checkout sessions
│   │   ├── webhook/polar/            # Polar webhook handler (signature + idempotency)
│   │   ├── portal/                   # Polar customer portal
│   │   ├── credits/balance/          # Credit balance + plan
│   │   ├── retouching/generate/      # Skin retouching
│   │   ├── face-edit/generate/       # Face editing (mask-based)
│   │   ├── image-edit/generate/      # Image generation
│   │   └── admin/                    # Admin endpoints (users, reconcile)
│   ├── retouching/                   # Skin retouching tool
│   ├── face-edit/                    # Face editing tool
│   ├── image-edit/                   # Image generation tool
│   ├── pricing/                      # Pricing page
│   └── page.tsx                      # Landing
├── components/{sections,ui}/         # Page sections + reusable UI
├── hooks/                            # credits, history, favorites, mask-canvas, ...
├── lib/
│   ├── services/ai/                  # Provider registry, prompts, models
│   ├── services/credits/             # Deduct, refund, cooldown
│   ├── supabase/                     # Client, server, admin, middleware
│   ├── polar.ts                      # Polar SDK factory
│   └── validations/                  # Zod schemas
├── supabase/migrations/              # 30+ SQL migrations
├── docs/                             # Internal design docs
└── SERVICE_GUIDE.md                  # Full project context (Korean)
```

</details>

---

## Local development

```bash
yarn install
cp .env.example .env.local   # then fill in your Supabase / Polar / AI keys
yarn dev                     # http://localhost:3000
```

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`
- `REPLICATE_API_TOKEN`
- `RESEND_API_KEY`, `OWNER_EMAIL`

---

## Status

- ✅ **Live in production** at [phos.studio](https://phos.studio)
- ✅ Three core tools shipped (Retouching, Face Edit, Image Edit)
- ✅ Polar payment + subscription lifecycle wired end-to-end
- 🚧 Upscaling tool — service implemented, page UI pending
- 🚧 Korean / English landing copy refinement (en-first strategy)

---

<sub>Built solo by [@qudgus21](https://github.com/qudgus21). Source available for portfolio reference — not licensed for redistribution.</sub>
