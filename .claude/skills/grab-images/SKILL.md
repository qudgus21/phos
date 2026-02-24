# grab-images — 외부 웹사이트 이미지 크롤러

외부 웹사이트에서 이미지를 크롤링하여 로컬 프로젝트에 저장합니다.
SPA + 로그인 필요 사이트까지 대응하기 위해 Playwright 사용.

## 사용법

```
/grab-images <URL> <저장경로> [옵션]
```

### 명령 형식

- `/grab-images https://example.com/gallery public/images/home` — 공개 페이지 이미지 수집
- `/grab-images https://refinetool.com/image-edit public/images/image-edit --login` — `.env.local`에서 credentials 자동 탐색
- `/grab-images https://example.com/page public/images/page --email=a@b.com --pwd=1234` — credentials 직접 전달

### 옵션

| 옵션 | 설명 |
|------|------|
| `--login` | `.env.local`에서 `{DOMAIN}_EMAIL`, `{DOMAIN}_PWD` 패턴으로 credentials 탐색 |
| `--email=xxx` | 로그인 이메일 직접 지정 |
| `--pwd=yyy` | 로그인 비밀번호 직접 지정 |

## Phase별 실행

### Phase 0: 인자 파싱

`$ARGUMENTS`를 분석:
- **url**: 크롤링 대상 URL (필수)
- **savePath**: 저장 경로 (필수, 프로젝트 루트 기준 상대 경로)
- **--login**: `.env.local`에서 도메인 기반 credentials 탐색
  - 도메인에서 TLD 제거 후 대문자 변환: `refinetool.com` → `REFINETOOL_EMAIL`, `REFINETOOL_PWD`
- **--email / --pwd**: 인자로 직접 전달된 credentials

인자 누락 시 사용자에게 안내하고 중단.

### Phase 1: Playwright 환경 확인

1. `node_modules/playwright` 존재 확인 (Glob으로 체크)
2. 없으면 설치:
   ```bash
   yarn add -D playwright && npx playwright install chromium
   ```
3. 이미 설치되어 있으면 skip

### Phase 2: 크롤링 스크립트 생성 & 실행

`scripts/grab-images.mjs` 임시 스크립트를 생성한다.

스크립트 요구사항:
- Playwright chromium headless 브라우저로 URL 접속
- 로그인 필요 시:
  1. 페이지에서 `input[type="email"]`, `input[type="password"]` 또는 `input[name*="email"]`, `input[name*="password"]` 탐색
  2. credentials 입력
  3. submit 버튼 클릭 또는 Enter
  4. navigation 대기
- `networkidle` 대기 + 3초 추가 대기 (SPA 렌더링 완료용)
- 이미지 수집 대상:
  1. `<img>` 태그의 `src` 속성
  2. `<source>` 태그의 `srcset` 속성
  3. CSS `background-image: url(...)` 값
- 각 이미지에 대해:
  - 절대 URL로 변환
  - 자연 크기(naturalWidth × naturalHeight) 측정 (측정 불가 시 "unknown")
  - 파일 확장자 추출
- data URI, SVG inline, 1x1 트래킹 픽셀(크기 ≤ 2px) 필터링
- 결과를 JSON으로 `scripts/grabbed-images.json`에 저장

스크립트 실행:
```bash
node scripts/grab-images.mjs \
  --url="<URL>" \
  --save-path="<저장경로>" \
  [--email="<email>" --pwd="<password>"]
```

### Phase 3: 이미지 선택

1. `scripts/grabbed-images.json`을 읽는다
2. 수집된 이미지 목록을 사용자에게 테이블로 표시:

```
┌────┬──────────────────────────────────┬────────────┬──────────┐
│ #  │ URL                              │ 크기       │ 확장자   │
├────┼──────────────────────────────────┼────────────┼──────────┤
│ 1  │ /images/hero-banner.jpg          │ 1920×1080  │ .jpg     │
│ 2  │ /images/product-01.png           │ 800×600    │ .png     │
│ 3  │ /assets/icon-small.svg           │ 24×24      │ .svg     │
└────┴──────────────────────────────────┴────────────┴──────────┘
총 3개 이미지 발견
```

3. AskUserQuestion으로 사용자에게 선택 요청:
   - "전체 다운로드" — 모든 이미지
   - "번호 선택" — 특정 번호 입력 (예: 1,2,5-8)
   - "크기 필터" — 최소 크기 기준 (예: 100px 이상만)

### Phase 4: 다운로드 & 저장

1. 저장 경로 디렉토리가 없으면 생성 (`mkdir -p`)
2. 다운로드 스크립트를 추가 생성하거나 Phase 2 스크립트를 확장하여:
   - Playwright의 쿠키/세션을 유지한 상태에서 `page.goto()` 또는 `request.get()`으로 이미지 다운로드
   - 인증이 필요한 이미지도 세션 쿠키로 접근 가능
3. 파일명 규칙:
   - 원본 파일명 유지
   - 중복 시 넘버링: `image.jpg` → `image-1.jpg`, `image-2.jpg`
   - 파일명 없는 URL은 `image-{index}.{ext}`
4. 각 파일 저장 후 결과 수집

### Phase 5: 정리

1. 임시 파일 삭제:
   - `scripts/grab-images.mjs`
   - `scripts/grabbed-images.json`
2. 다운로드 결과 요약 출력:

```
다운로드 완료: 5개 파일

┌────┬──────────────────────┬──────────┬──────────────────────────────┐
│ #  │ 파일명               │ 크기     │ 저장 경로                     │
├────┼──────────────────────┼──────────┼──────────────────────────────┤
│ 1  │ hero-banner.jpg      │ 245 KB   │ public/images/home/hero...   │
│ 2  │ product-01.png       │ 128 KB   │ public/images/home/prod...   │
└────┴──────────────────────┴──────────┴──────────────────────────────┘
```

### Phase 6: 지식 저장

실행 중 발생한 교훈을 `memory/skills/grab-images-lessons.md`에 기록.

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
| Playwright 설치 실패 | 에러 메시지 출력, 수동 설치 안내 |
| 로그인 실패 | credentials 확인 안내, `.env.local` 설정 가이드 |
| 페이지 로딩 타임아웃 (30초) | URL 접근 가능 여부 확인 안내 |
| 이미지 0개 수집 | SPA 렌더링 대기 시간 부족 가능성 안내, 재시도 제안 |
| 다운로드 실패 (403/404) | 해당 이미지 skip, 실패 목록 별도 표시 |
| credentials 미설정 | `.env.local`에 `{DOMAIN}_EMAIL`, `{DOMAIN}_PWD` 추가 안내 |

## 주의사항

- 크롤링은 대상 사이트의 이용약관을 준수해야 합니다
- 대량 요청 시 서버 부담을 줄이기 위해 순차 다운로드 (병렬 X)
- 저작권 있는 이미지는 참고 용도로만 사용
