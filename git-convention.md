# Git 브랜치 전략 및 컨벤션

## 브랜치 구조

```
main          ← 배포 브랜치 (항상 안정, PR만 병합)
  ↑ PR only
staging       ← 통합 테스트 / QA 브랜치 (PR만 병합)
  ↑ PR only
feat/auth/kakao-login
feat/books/detail-ui
fix/exchange/chat-bug
...
```

## 브랜치별 역할

| 브랜치 | 역할 | 직접 push |
|--------|------|-----------|
| `main` | 실제 배포본. 항상 동작이 보장된 상태 유지 | ❌ PR만 |
| `staging` | 피처 통합 및 QA. 릴리즈 전 검증 공간 | ❌ PR만 |
| `feat/*` | 기능 개발 | ✅ 자유롭게 |
| `fix/*` | 버그 수정 | ✅ 자유롭게 |
| `hotfix/*` | 프로덕션 긴급 수정 | ✅ 자유롭게 |
| `chore/*` | 의존성, 설정, 문서 등 비기능 작업 | ✅ 자유롭게 |

## 기본 워크플로우

### 1. 기능 개발

```bash
# staging 기반으로 브랜치 생성
git checkout staging
git pull origin staging
git checkout -b feat/auth/kakao-login

# 작업 후 staging으로 PR
```

### 2. 릴리즈

```bash
# staging에서 충분히 검증 후 main으로 PR
# PR 제목: release: v0.x.x
```

### 3. 핫픽스 (프로덕션 긴급 버그)

```bash
# main 기반으로 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/login-crash

# 수정 후 main으로 PR → merge 후 staging에도 반영
git checkout staging
git cherry-pick <커밋 해시>
git push origin staging
```

## 브랜치 네이밍

```
feat/{도메인}/{내용}      feat/auth/kakao-login
fix/{도메인}/{내용}       fix/books/image-load
hotfix/{내용}            hotfix/token-refresh-crash
chore/{내용}             chore/deps-update
```

### 도메인 목록

| 도메인 | 설명 |
|--------|------|
| `auth` | 로그인, 회원가입, 토큰 |
| `books` | 도서 등록, 상세, 검색 |
| `exchange` | 교환 요청, 채팅 |
| `profile` | 마이페이지, 사용자 정보 |
| `home` | 홈 화면 |
| `common` | 공통 컴포넌트, 유틸 |

## 커밋 메시지 컨벤션

```
{type}({도메인}): {내용}

feat(auth): 카카오 iOS 시뮬레이터 로그인 구현
fix(books): 도서 이미지 로딩 실패 처리
chore: expo 의존성 업데이트
```

### 타입 목록

| 타입 | 설명 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `style` | UI/스타일 변경 |
| `chore` | 빌드, 설정, 의존성 |
| `docs` | 문서 수정 |
| `revert` | 이전 커밋 되돌리기 |

## PR 규칙

- **base 브랜치**: 작업 브랜치 → `staging` / `staging` → `main`
- **리뷰어**: 상대방 1명 지정
- **머지 방식**: Squash and merge 권장 (커밋 히스토리 정리)
- PR 제목은 커밋 메시지 컨벤션 동일하게

## GitHub Branch Protection 설정 (권장)

GitHub 저장소 → Settings → Branches → Add rule

**`main` 브랜치:**
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals when new commits are pushed

**`staging` 브랜치:**
- ✅ Require a pull request before merging
- ✅ Require approvals: 1

> Private 저장소의 경우 GitHub Free 플랜에서는 Branch Protection을 사용할 수 없습니다.
> 저장소를 Public으로 전환하거나 GitHub Pro/Team 플랜에서 사용 가능합니다.

## 자주 쓰는 명령어

```bash
# 최신 staging 기반으로 새 브랜치 생성
git checkout staging && git pull origin staging && git checkout -b feat/{도메인}/{내용}

# staging에 올라간 내 브랜치 최신화 (rebase 권장)
git fetch origin && git rebase origin/staging

# 작업 완료 후 push
git push origin feat/{도메인}/{내용}
```
