---
name: release
description: main 브랜치에서 시맨틱 버전 태그 생성 + GitHub Release 노트 작성.
disable-model-invocation: false
allowed-tools: Bash(git *), Bash(gh *)
user-invocable: true
---

# Release — 시맨틱 버전 릴리즈 워크플로우

main 브랜치의 현재 상태를 기준으로 시맨틱 버전 태그를 생성하고 GitHub Release를 발행한다.

## 프로젝트 컨텍스트

- **브랜치 전략**: main 직접 작업 (develop 브랜치 없음)
- **배포**: Vercel (main 브랜치 자동 배포)
- **프로덕션 URL**: `https://phos.studio`
- **버전 관리**: Git 태그 기반 시맨틱 버전 (vX.Y.Z)

---

## Step 1: 릴리즈 대상 확인

```bash
git fetch origin

# 1. 최신 태그 확인
LAST_TAG=$(git tag --sort=-version:refname | head -1)

if [ -z "$LAST_TAG" ]; then
  echo "태그 없음 — 첫 릴리즈 (v1.0.0)"
  git log origin/main --oneline --limit=30
else
  echo "마지막 릴리즈: $LAST_TAG"
  TAG_TIME=$(git log $LAST_TAG -1 --format="%ai")
  echo "릴리즈 시점: $TAG_TIME"

  # 2. 태그 이후 커밋 목록
  git log ${LAST_TAG}..origin/main --oneline
fi
```

사용자에게 다음 형식으로 보여준다:

```
📦 릴리즈 대상 커밋 목록: ({마지막 태그 또는 "첫 릴리즈"} 이후)

1. abc1234 — 기능 A 추가
2. def5678 — 버그 B 수정
3. ghi9012 — UI 개선

총 {N}개 커밋
```

**⛔ 여기서 STOP. 사용자에게 릴리즈 진행 여부를 확인한다.**

---

## Step 2: 버전 결정

### 시맨틱 버전 규칙

| 변경 유형 | 버전 범프 | 예시 |
|-----------|----------|------|
| 호환성 깨지는 API/UI 변경 | **Major** (X.0.0) | 기존 URL 구조 변경, DB 스키마 breaking change |
| 새 기능 추가 | **Minor** (x.Y.0) | 새 에디터 추가, 새 결제 옵션 |
| 버그 수정, 소소한 개선 | **Patch** (x.y.Z) | UI 수정, 성능 개선, 오타 수정 |

### 버전 제안

커밋 내용을 분석하여 적절한 버전을 제안한다:

```
현재 버전: {LAST_TAG 또는 "없음"}
추천 버전: v{X.Y.Z}
사유: {커밋 분석 요약}
```

**⛔ 사용자에게 버전을 확인한다.**

---

## Step 3: 태그 생성 & 푸시

```bash
# main이 최신 상태인지 확인
git checkout main
git pull origin main

# 태그 생성
git tag -a v{X.Y.Z} -m "Release v{X.Y.Z}: {한줄 요약}"

# 태그 푸시
git push origin v{X.Y.Z}
```

---

## Step 4: GitHub Release 노트 작성

```bash
gh release create v{X.Y.Z} \
  --title "v{X.Y.Z}" \
  --notes "$(cat <<'EOF'
## 🚀 v{X.Y.Z}

### 변경 사항

#### ✨ 새 기능
- {새 기능 목록}

#### 🐛 버그 수정
- {버그 수정 목록}

#### 🔧 개선
- {개선 사항 목록}

---

**Full Changelog**: https://github.com/qudgus21/phos/compare/{LAST_TAG}...v{X.Y.Z}
EOF
)"
```

첫 릴리즈인 경우 `--notes`에 "🎉 첫 번째 릴리즈"를 포함하고, Full Changelog 대신 주요 기능을 나열한다.

---

## Step 5: 완료 리포트

```markdown
## ✅ 릴리즈 완료

- **버전**: v{X.Y.Z}
- **태그**: 생성 완료 ✅
- **GitHub Release**: 발행 완료 ✅
- **배포**: Vercel 자동 배포 (main 브랜치 기반)
- **릴리즈 URL**: https://github.com/qudgus21/phos/releases/tag/v{X.Y.Z}
```

---

## 절대 하지 않는 것

- ❌ 사용자 확인 없이 태그 생성
- ❌ force push 또는 태그 덮어쓰기
- ❌ main 외 브랜치에서 릴리즈
- ❌ 커밋 (`/commit-and-push`로 별도 진행)
