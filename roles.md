# PageMate 역할 분담 v1.1

| 항목 | 내용 |
|------|------|
| 팀 구성 | 2인 (A · B) |
| 분담 방식 | **도메인 오너십** — 각자 맡은 도메인의 BE API · DB · FE 화면 전부 담당 |
| 협업 도구 | GitHub, Claude Code |
| 리뷰 정책 | 모든 PR은 상대방 1인 승인 후 머지 |

---

## 도메인 오너십 한눈에 보기

| 도메인 | A | B |
|--------|---|---|
| 인증 (Auth) | ✅ | |
| 도서 (Books) | ✅ | |
| 프로필 (Profile) | ✅ | |
| 교환 (Exchange) | | ✅ |
| 채팅 (Chat) | | ✅ |
| 독서 기록 (Reading Records) | | ✅ |
| 알림 (Notifications) | | ✅ |
| **공유** 인프라 · DB 설계 · 디자인 시스템 | 🤝 | 🤝 |

> 오너가 해당 도메인의 **DB 테이블 설계 → API 구현 → FE 화면 구현 → 연동 테스트**를 모두 책임집니다.

---

## A 담당 도메인

### 인증 (Auth)

| 작업 | 구분 |
|------|------|
| 카카오 / 구글 OAuth 2.0 서버 연동 | BE |
| JWT 발급 · 재발급 · 무효화 API | BE |
| Spring Security 필터 체인 설정 | BE |
| users 테이블 설계 | DB |
| 소셜 로그인 화면 UI | FE |
| OAuth 인가 코드 획득 (expo-auth-session) | FE |
| 토큰 SecureStore 저장 + axios 인터셉터 | FE |
| 온보딩 화면 (최초 가입 프로필 설정) | FE |

---

### 도서 (Books)

| 작업 | 구분 |
|------|------|
| books 테이블 설계 (coverColor, location 컬럼 포함) | DB |
| 카카오 도서 검색 프록시 API | BE |
| 도서 CRUD API | BE |
| 위치 기반 근거리 정렬 (Haversine, Spatial Index) | BE |
| 장르 · 컨디션 필터 (QueryDSL) | BE |
| S3 도서 이미지 업로드 처리 | BE |
| 홈 화면 (근거리 도서 슬라이드, 최근 등록) | FE |
| 탐색 / 검색 화면 (필터 칩, 결과 그리드) | FE |
| 도서 상세 화면 | FE |
| 도서 등록 폼 (카카오 검색 자동완성, 이미지 업로드) | FE |
| PMBookCover · PMBookCard 컴포넌트 | FE |

---

### 프로필 (Profile)

| 작업 | 구분 |
|------|------|
| 내 프로필 조회 · 수정 API | BE |
| 타인 프로필 · 등록 도서 조회 API | BE |
| S3 프로필 이미지 업로드 처리 | BE |
| 마이 페이지 화면 (프로필 카드, 내 도서, 설정 메뉴) | FE |
| 프로필 편집 화면 (닉네임 · 태그 · 동네 · 이미지) | FE |
| 타인 프로필 화면 | FE |
| PMAvatar · PMBadge 컴포넌트 | FE |

---

## B 담당 도메인

### 교환 (Exchange)

| 작업 | 구분 |
|------|------|
| exchanges 테이블 설계 (requested_book, offered_book) | DB |
| 교환 요청 · 수락 · 거절 · 완료 API | BE |
| 수락 시 채팅방 자동 생성 트리거 | BE |
| 완료 시 양쪽 도서 상태(COMPLETED) 변경 | BE |
| 중복 요청 · 본인 요청 방지 검증 | BE |
| 교환 목록 화면 (탭: 진행중 / 완료) | FE |
| 교환 요청 모달 (제안 도서 선택 포함) | FE |
| 수락 · 거절 UI | FE |
| 교환 상태 배지 (PMBadge 활용) | FE |

---

### 채팅 (Chat)

| 작업 | 구분 |
|------|------|
| chat_rooms · messages 테이블 설계 | DB |
| WebSocket STOMP 서버 설정 | BE |
| 메시지 저장 · 브로드캐스트 | BE |
| 채팅방 목록 · 메시지 내역 API | BE |
| 채팅방 목록 화면 (파트너 · 교환 중인 책 · 안읽은 수) | FE |
| 채팅방 화면 (말풍선, 시스템 메시지, 입력바) | FE |
| STOMP 클라이언트 연결 · 구독 · 발신 | FE |
| 메시지 내역 커서 기반 무한 스크롤 | FE |

---

### 독서 기록 (Reading Records)

| 작업 | 구분 |
|------|------|
| reading_records 테이블 설계 | DB |
| 독서 기록 CRUD API | BE |
| 타인 공개 기록 조회 API | BE |
| 독서 기록 등록 폼 (별점, 감상, 날짜) | FE |
| 마이 페이지 독서 기록 목록 섹션 | FE |

---

### 알림 (Notifications)

| 작업 | 구분 |
|------|------|
| notifications 테이블 설계 | DB |
| FCM 발송 로직 (Firebase Admin SDK) | BE |
| 교환 · 채팅 이벤트 알림 트리거 | BE |
| 알림 목록 · 읽음 처리 API | BE |
| FCM 수신 설정 (expo-notifications) | FE |
| 알림 목록 화면 | FE |
| 벨 아이콘 · 미읽은 dot 표시 | FE |

---

## 공동 책임 영역

### 프로젝트 초기 세팅 (1주차 함께)

| 항목 | 담당 |
|------|------|
| ERD 설계 전체 리뷰 | 🤝 |
| API 명세(`api-spec.md`) 초안 합의 | 🤝 |
| Spring Boot 프로젝트 초기화 (공통 응답 포맷 · 에러 핸들러) | A |
| Expo 프로젝트 초기화 (네비게이션 · tokens · PMIcon · PMTabBar) | B |
| GitHub Actions CI (빌드 · 테스트) | A |
| Expo EAS Build 설정 | B |

### 지속 공동 관리

| 영역 | 내용 |
|------|------|
| API 명세 | 도메인 오너가 변경 시 `api-spec.md` 즉시 업데이트 |
| 코드 리뷰 | 모든 feature PR은 상대방이 리뷰 후 머지 |
| 버그 대응 | 해당 도메인 오너 1차 처리, 필요 시 함께 해결 |
| QA | 전체 유저 플로우 함께 점검 |

---

## 협업 규칙

### Git 브랜치 전략

```
main
└── develop
    ├── feature/auth        ← A
    ├── feature/books       ← A
    ├── feature/profile     ← A
    ├── feature/exchange    ← B
    ├── feature/chat        ← B
    ├── feature/reading     ← B
    └── feature/notification ← B
```

- 도메인 하나 = 브랜치 하나 (FE · BE 코드를 같이 커밋)
- `develop` → `main` 머지는 마일스톤 완료 시점에만

### 커밋 메시지 컨벤션

```
feat(books): 카카오 도서 검색 프록시 API 구현
feat(books): 도서 상세 화면 UI 구현
fix(exchange): 중복 교환 요청 방지 로직 수정
refactor(chat): STOMP 클라이언트 훅 분리
test(auth): JWT 갱신 단위 테스트 추가
chore: 공통 응답 포맷 DTO 추가
```

### API 개발 순서 원칙

1. 도메인 오너가 `api-spec.md`에 request/response 포맷 확정
2. 상대방 리뷰 후 BE 구현 시작
3. FE는 Zod 스키마 + 목 데이터로 화면 선개발
4. BE 완료 후 실제 API로 교체 + 연동 테스트

---

## 주간 미팅 아젠다 (권장)

| 항목 | 시간 |
|------|------|
| 지난 주 완료 항목 확인 | 5분 |
| 이번 주 작업 싱크 | 10분 |
| 블로커 공유 및 해결 | 10분 |
| 다음 도메인 API 스펙 사전 합의 | 5분 |
