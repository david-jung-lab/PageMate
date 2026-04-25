# PageMate 역할 분담 v1.0

| 항목 | 내용 |
|------|------|
| 팀 구성 | 2인 (A: Frontend, B: Backend) |
| 협업 도구 | GitHub, Claude Code |
| 리뷰 정책 | 모든 PR은 상대방 1인 승인 후 머지 |

---

## 역할 개요

| 구분 | 담당자 A | 담당자 B |
|------|---------|---------|
| 주 역할 | Frontend (React Native) | Backend (Spring Boot) |
| 기술 스택 | Expo, TypeScript, TanStack Query, Zustand | Java 21, Spring Boot 3, JPA, MySQL |
| 인프라 담당 | Expo EAS Build, App Store/Play Store 제출 | Railway 배포, Docker, GitHub Actions |

---

## 도메인별 상세 분담

### 인증 (Auth)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 소셜 로그인 화면 UI | ✅ | |
| OAuth 인가 코드 획득 (expo-auth-session) | ✅ | |
| 카카오/구글 OAuth 서버 연동 | | ✅ |
| JWT 발급 및 갱신 API | | ✅ |
| 토큰 SecureStore 저장 + 인터셉터 | ✅ | |
| Spring Security 설정 | | ✅ |

---

### 도서 (Books)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 홈 / 검색 화면 UI | ✅ | |
| 도서 카드 컴포넌트 | ✅ | |
| 필터/정렬 UI | ✅ | |
| 도서 목록 API 연동 (무한 스크롤) | ✅ | |
| 도서 검색/필터 API (QueryDSL) | | ✅ |
| 도서 등록 폼 화면 | ✅ | |
| 이미지 업로드 (expo-image-picker) | ✅ | |
| S3 이미지 업로드 처리 | | ✅ |
| 도서 CRUD API | | ✅ |

---

### 교환 요청 (Exchange)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 교환 요청 버튼 / 모달 UI | ✅ | |
| 내 교환 목록 화면 | ✅ | |
| 수락/거절 UI | ✅ | |
| 교환 상태 배지 컴포넌트 | ✅ | |
| 교환 요청/수락/거절 API | | ✅ |
| 수락 시 채팅방 자동 생성 | | ✅ |
| 교환 완료 시 도서 상태 변경 | | ✅ |

---

### 채팅 (Chat)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 채팅방 목록 화면 UI | ✅ | |
| 채팅 화면 UI (말풍선 등) | ✅ | |
| STOMP 클라이언트 연결/구독 | ✅ | |
| 실시간 메시지 수신/발신 | ✅ | |
| 메시지 내역 API 연동 | ✅ | |
| WebSocket STOMP 서버 설정 | | ✅ |
| 메시지 브로드캐스트 처리 | | ✅ |
| 채팅방/메시지 API | | ✅ |

---

### 알림 (Notifications)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| FCM 수신 설정 (expo-notifications) | ✅ | |
| 알림 목록 화면 UI | ✅ | |
| 알림 API 연동 | ✅ | |
| FCM 발송 로직 (Firebase Admin SDK) | | ✅ |
| 알림 이벤트 트리거 (교환, 채팅) | | ✅ |
| 알림 API | | ✅ |

---

### 독서 기록 (Reading Records)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 독서 기록 피드 UI | ✅ | |
| 독서 기록 등록 폼 | ✅ | |
| 독서 기록 API 연동 | ✅ | |
| 독서 기록 CRUD API | | ✅ |

---

### 프로필 (Profile)

| 작업 | A (FE) | B (BE) |
|------|--------|--------|
| 내 프로필 화면 UI | ✅ | |
| 타인 프로필 화면 UI | ✅ | |
| 프로필 이미지 업로드 | ✅ | |
| 프로필 API 연동 | ✅ | |
| 유저 프로필 API | | ✅ |
| 프로필 이미지 S3 업로드 | | ✅ |

---

## 공동 책임 영역

| 영역 | 내용 |
|------|------|
| API 명세 합의 | 신규 API 개발 전 request/response 포맷 사전 협의 |
| 코드 리뷰 | 모든 feature PR은 상대방이 리뷰 후 머지 |
| 버그 대응 | 발생 도메인 담당자가 1차 처리, 필요 시 함께 해결 |
| QA (Week 10) | 전체 유저 플로우 함께 점검 |
| 문서 관리 | API 변경 시 `api-spec.md` 즉시 업데이트 |

---

## 협업 규칙

### Git 브랜치 전략

```
main
└── develop
    ├── feature/auth-fe        (A)
    ├── feature/auth-be        (B)
    ├── feature/books-fe       (A)
    ├── feature/books-be       (B)
    └── ...
```

- `feature/{도메인}-{fe|be}` 브랜치에서 작업
- `develop` → `main` 머지는 마일스톤 완료 시점에만

### 커밋 메시지 컨벤션

```
feat: 도서 등록 API 구현
fix: 토큰 갱신 인터셉터 무한 루프 수정
refactor: Exchange 서비스 레이어 분리
test: Book 서비스 단위 테스트 추가
chore: Gradle 의존성 업데이트
```

### API 개발 순서 원칙

1. B가 API 스펙 확정 후 Swagger 문서 공유
2. A가 Zod 스키마 정의 후 목 데이터로 UI 선개발
3. B API 개발 완료 시 실제 연동으로 교체
4. 양측 함께 연동 테스트

---

## 주간 미팅 아젠다 (권장)

| 항목 | 시간 |
|------|------|
| 지난 주 완료 항목 확인 | 5분 |
| 이번 주 작업 싱크 | 10분 |
| 블로커 공유 및 해결 | 10분 |
| 다음 API 스펙 사전 합의 | 5분 |
