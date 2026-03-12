# 이미지 저장/전송 최적화 계획

## 현재 상황

### 인프라
- **Storage**: Supabase Storage (generation-outputs 버킷)
- **포맷**: 모델 출력 그대로 PNG 저장
- **전송**: Supabase Storage 직접 서빙
- **이미지 표시**: Next.js `<Image>` 컴포넌트에 `unoptimized` 적용 (2025-03-11) => 파일크면 최적화가 안되고 있음 (액박뜸)

### 흐름 (현재)
```
AI 모델 생성 → Replicate 임시 URL 즉시 응답
  → 백그라운드: fetch → Supabase Storage 업로드 (PNG 그대로)
    → DB output_urls 영구 URL로 UPDATE
```

### 문제점
1. **4K PNG 1장 = ~22MB** — 네이티브 4K 생성 시 매우 무거움
2. **Next.js `/_next/image` 프록시 500 에러** — 큰 PNG 처리 실패 → `unoptimized`로 임시 해결
3. **Storage 비용 폭증** — 10만 유저 기준 Supabase Storage만 **월 $2,619**
   - 저장: 9TB (300만장 × 3MB WebP 기준) = $189/월
   - 전송: 27TB (이미지당 평균 3회 조회) = **$2,430/월** ← 핵심 병목
4. **브라우저 로딩 느림** — 22MB를 unoptimized로 직접 전달

### 용량 비교
| 포맷 | 1K | 2K | 4K |
|------|-----|-----|-----|
| PNG | 1~3MB | 5~8MB | 15~25MB |
| WebP (q90) | 0.2~0.5MB | 0.5~1MB | 2~4MB |

---

## 정의한 문제

### 핵심: 전송 비용
- Supabase Storage 전송 요금: $0.09/GB
- 10만 유저 × 일 1장 × 이미지당 3회 조회 × 22MB(PNG) = **월 $5,940**
- WebP로 줄여도 3MB × 같은 조건 = **월 $2,430**
- **전송 비용이 무료인 Storage로 이전해야 함**

### 부수 문제
- PNG 원본 저장 → 저장 용량도 비효율
- 사용자에게 PNG 다운로드 제공 필요 (신뢰감 — "고퀄 서비스"에서 WebP 다운은 싸 보임)
- 서버사이드 이미지 변환 시 메모리/타임아웃 제약

---

## 해결 방향

### 목표 아키텍처: AWS Lambda + Cloudflare R2

```
Vercel API (이미지 생성 완료)
  → 클라이언트에 임시 URL 즉시 응답
  → AWS Lambda 호출 (백그라운드)
    → Replicate 임시 URL에서 PNG fetch
    → sharp로 WebP 변환 (quality 90)
    → Cloudflare R2 업로드
    → Supabase DB에 영구 R2 URL UPDATE
```

### 역할 분담
| 서비스 | 역할 | 비고 |
|--------|------|------|
| **Supabase** | DB + Auth | 기존 그대로 유지 |
| **Cloudflare R2** | 이미지 저장 + 서빙 | 전송 비용 무료 |
| **AWS Lambda** | PNG → WebP 변환 | 메모리 최대 10GB, sharp 지원 |
| **Vercel** | Next.js 앱 + API | 기존 그대로 |

### 비용 (10만 유저 기준)
| 항목 | 현재 (Supabase PNG) | 목표 (R2 + WebP) |
|------|---------------------|------------------|
| 저장 | $189/월 (9TB PNG) | $135/월 (9TB WebP) |
| 전송 | **$2,430/월** | **$0** |
| 변환 (Lambda) | - | ~$15/월 |
| **합계** | **$2,619/월** | **~$150/월** |

### 다운로드 전략
- **Storage 저장**: WebP (표시/히스토리/전송용)
- **다운로드**: PNG (클라이언트 Canvas API로 WebP → PNG 변환, 서버 부담 없음)
- 사용자는 `.png` 파일을 받아 **신뢰감 유지**
- 화질: WebP q90에서 PNG로 감싸는 것이므로 원본 무손실은 아님 (시각적 차이 거의 없음)

### preview_urls 시스템 (구현 완료)
- 업스케일 시: 1K 프리뷰 + 4K 원본 두 버전 저장
- 히스토리 썸네일: preview_urls[0] (가벼운 1K)
- 결과 패널: 1K 먼저 표시 → 4K 백그라운드 로드 후 교체

---

## 구현 작업 목록

### Phase 1: Cloudflare R2 설정
- [ ] Cloudflare 계정 + R2 버킷 생성
- [ ] 커스텀 도메인 연결 (CDN 자동 적용)
- [ ] R2 접근용 API 토큰 생성

### Phase 2: AWS Lambda 함수
- [ ] Lambda 함수 생성 (Node.js + sharp Layer)
- [ ] 입력: 이미지 URL 배열 + 메타데이터
- [ ] 처리: fetch → sharp WebP 변환 (q90) → R2 업로드
- [ ] 출력: R2 영구 URL 배열
- [ ] API Gateway 또는 직접 호출 방식 결정

### Phase 3: Vercel API 수정
- [ ] 백그라운드 업로드: Supabase Storage → Lambda 호출로 교체
- [ ] fire-and-forget `(async () => {})()` → `after()` 전환 (Next.js 15)
- [ ] DB UPDATE: output_urls를 R2 URL로
- [ ] preview_urls도 동일하게 R2로

### Phase 4: 프론트엔드
- [ ] 이미지 URL 도메인 변경 반영 (R2 도메인)
- [ ] 다운로드 함수: WebP → PNG 클라이언트 변환
- [ ] next.config.js images.remotePatterns에 R2 도메인 추가

### Phase 5: 마이그레이션
- [ ] 기존 Supabase Storage 이미지 → R2 이전 스크립트
- [ ] DB의 기존 URL들 일괄 업데이트
- [ ] Supabase Storage 버킷 정리

---

## 업계 참고

| 서비스 | 생성 해상도 | 고해상도 방식 | 표시 포맷 | 다운로드 |
|--------|-----------|-------------|----------|---------|
| Midjourney | 1024×1024 | 업스케일 2x~4x | WebP | PNG |
| DALL-E 3 | 1024×1024 | 최대 1792 고정 | CDN | URL |
| Leonardo AI | 1024×1024 | 업스케일 (Seedream 4.0만 네이티브 4K) | PNG/JPG | PNG (유료) |
| Ideogram | 기본 크기 | 2x→4x→8x 단계적 업스케일 | JPG | PNG (유료) |

대부분 **1K 생성 → 업스케일로 고해상도** 패턴. 네이티브 4K는 거의 없음.

---

## 결정 사항 (2025-03-11)
- `unoptimized` 적용으로 4K PNG 500 에러 임시 해결 (커밋 완료)
- 이미지 로딩 중 스피너 추가 (커밋 완료)
- Storage 인프라 전환: Supabase → **Cloudflare R2 + AWS Lambda** 확정
- WebP 저장 + PNG 다운로드 전략 확정
