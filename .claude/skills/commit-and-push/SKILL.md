---
name: commit-and-push
description: Review staged changes, create a commit, and push to remote. Use when you want to commit and push staged changes.
disable-model-invocation: false
allowed-tools: Bash(git *)
---

# Commit and Push Workflow

이 스킬은 staged된 변경사항을 커밋하고 push합니다.

## Step 1: Staged 내용 확인

먼저 staged된 파일과 변경사항을 확인합니다:

```bash
git status
git diff --staged
```

staged된 파일 목록과 변경 내용을 분석하여 어떤 작업이 이루어졌는지 파악합니다.

## Step 2: 커밋 메시지 작성

staged된 변경사항을 분석하여 의미있는 커밋 메시지를 작성합니다:

**커밋 메시지 가이드라인:**
- **반드시 한글로 작성한다**
- 첫 줄은 50자 이내로 요약 (동사로 시작: 추가, 수정, 개선, 리팩토링 등)
- 변경사항의 목적과 이유를 명확히 기술
- 여러 파일이 변경된 경우 주요 변경사항 나열

**예시:**
```
사용자 인증 기능 추가

- 로그인/로그아웃 기능 구현
- JWT 토큰 검증 추가
- 사용자 세션 관리 생성
```

## Step 3: 커밋 생성

작성한 메시지로 커밋을 생성합니다:

```bash
git commit -m "커밋 메시지

상세 내용
- 변경사항 1
- 변경사항 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**중요:** Co-Authored-By 태그를 항상 포함합니다.

## Step 4: Push

커밋을 원격 저장소에 push합니다:

```bash
git push
```

만약 새 브랜치를 처음 push하는 경우:
```bash
git push -u origin $(git branch --show-current)
```

## 주의사항

- staged 영역이 비어있으면 경고하고 중단
- .env, credentials 같은 민감한 파일이 staged되어 있으면 경고
- 커밋 전 변경사항을 사용자에게 요약해서 보여주기
- push 실패 시 에러 메시지 출력

## 사용 시점

- 코드 작업이 완료되어 저장하고 싶을 때
- PR 준비를 위해 변경사항을 정리할 때
- 팀원과 협업을 위해 코드를 공유할 때
- 작업 단위로 커밋을 나누고 싶을 때
