# PageMate WBS (Work Breakdown Structure) v1.0

| 항목 | 내용 |
|------|------|
| 총 기간 | 10주 (MVP 기준) |
| 인원 | 2명 (A: Frontend, B: Backend) |
| 개발 방식 | 주 단위 스프린트, GitHub PR 기반 협업 |
| 브랜치 전략 | `main` ← `develop` ← `feature/{기능명}` |

---

## 마일스톤 요약

| 마일스톤 | 기간 | 내용 |
|---------|------|------|
| M0 환경 세팅 | Week 1 | 프로젝트 초기화, 공통 설정, CI/CD |
| M1 인증 | Week 2 | 소셜 로그인, JWT, 토큰 관리 |
| M2 도서 | Week 3~4 | 도서 등록·검색·상세, 이미지 업로드 |
| M3 교환 | Week 5~6 | 교환 요청·수락·거절·완료 |
| M4 채팅 | Week 7~8 | WebSocket 채팅, FCM 푸시 알림 |
| M5 독서/프로필 | Week 9 | 독서 기록, 유저 프로필 |
| M6 통합/배포 | Week 10 | QA, 버그픽스, 스토어 제출 |

---

## Week 1 — 환경 세팅 (M0)

### 공통
- [ ] GitHub 저장소 생성 (`pagemate-app`, `pagemate-server`)
- [ ] 브랜치 전략 수립 및 PR 템플릿 설정
- [ ] 개발 컨벤션 문서 작성 (네이밍, 커밋 메시지)

### Frontend (A)
- [ ] Expo 프로젝트 초기화 (`expo init`)
- [ ] 디렉토리 구조 세팅 (`features/`, `components/`, `lib/`)
- [ ] 라이브러리 설치 (React Navigation, TanStack Query, Zustand, NativeWind, Zod, Axios)
- [ ] Axios 인스턴스 설정 (`lib/api.ts`) — Base URL, 인터셉터
- [ ] 공통 응답 타입 정의 (`types/api.ts`)

### Backend (B)
- [ ] Spring Boot 3 프로젝트 초기화 (Gradle)
- [ ] 의존성 추가 (Security, JPA, QueryDSL, SpringDoc, JWT, AWS SDK, FCM)
- [ ] Docker Compose MySQL 환경 설정
- [ ] 공통 응답 포맷 구현 (`ApiResponse<T>`)
- [ ] 전역 예외 처리 (`GlobalExceptionHandler`)
- [ ] Flyway 마이그레이션 초기 설정
- [ ] GitHub Actions CI 파이프라인 구성 (빌드 + 테스트)
- [ ] Railway 배포 환경 세팅

---

## Week 2 — 인증 (M1)

### Frontend (A)
- [ ] 로그인 화면 UI 구현 (카카오 / 구글 버튼)
- [ ] `expo-auth-session`으로 OAuth 인가 코드 획득
- [ ] 로그인 API 연동 (`/auth/oauth/kakao`, `/auth/oauth/google`)
- [ ] Access/Refresh Token `SecureStore` 저장
- [ ] Axios 인터셉터 — 401 시 자동 토큰 갱신 (`/auth/refresh`)
- [ ] 인증 전역 상태 관리 (Zustand `useAuthStore`)
- [ ] 로그인 여부에 따른 라우팅 분기 (Protected Route)

### Backend (B)
- [ ] OAuth 2.0 플로우 구현 (카카오, 구글)
- [ ] `users` 테이블 마이그레이션 + JPA Entity
- [ ] 소셜 유저 정보 upsert 로직
- [ ] JWT Access Token (1시간) + Refresh Token (30일) 발급
- [ ] `POST /auth/oauth/kakao`, `POST /auth/oauth/google` 구현
- [ ] `POST /auth/refresh` 구현
- [ ] `POST /auth/logout` 구현
- [ ] Spring Security 설정 (공개/비공개 엔드포인트 분리)

---

## Week 3~4 — 도서 (M2)

### Week 3

#### Frontend (A)
- [ ] 홈 화면 레이아웃 구현 (탭 네비게이션)
- [ ] 도서 목록 화면 UI (카드 컴포넌트, 스크롤)
- [ ] 도서 검색바 컴포넌트 (키워드 입력)
- [ ] 장르/상태 필터 UI
- [ ] `GET /books` API 연동 (TanStack Query, 무한 스크롤)

#### Backend (B)
- [ ] `books` 테이블 마이그레이션 + JPA Entity
- [ ] `GET /books` — 키워드 검색 + 필터 + 페이지네이션 (QueryDSL)
- [ ] `POST /books` — 도서 등록 (AWS S3 이미지 업로드 포함)
- [ ] `GET /books/{id}` — 도서 상세
- [ ] `GET /books/me` — 내 도서 목록

### Week 4

#### Frontend (A)
- [ ] 도서 상세 화면 UI (이미지, 정보, 소유자 정보)
- [ ] 도서 등록 폼 화면 (React Hook Form + Zod)
- [ ] 이미지 업로드 (`expo-image-picker`)
- [ ] `POST /books`, `DELETE /books/{id}` API 연동
- [ ] 내 도서 목록 화면 (프로필 탭)

#### Backend (B)
- [ ] `PATCH /books/{id}` — 도서 수정
- [ ] `DELETE /books/{id}` — 도서 삭제
- [ ] S3 이미지 삭제 처리 (도서 삭제 시 연동)
- [ ] 도서 Service 단위 테스트 작성 (JUnit + Mockito)

---

## Week 5~6 — 교환 요청 (M3)

### Week 5

#### Frontend (A)
- [ ] 교환 요청 버튼 UI (도서 상세 화면)
- [ ] 교환 요청 메시지 입력 모달
- [ ] `POST /exchanges` API 연동
- [ ] 내 교환 목록 화면 (요청한 것 / 받은 것 탭)
- [ ] `GET /exchanges/me` API 연동

#### Backend (B)
- [ ] `exchange_requests` 테이블 마이그레이션 + Entity
- [ ] `POST /exchanges` — 교환 요청 생성 (중복 요청, 자기 자신 방어)
- [ ] `GET /exchanges/me` — 내 교환 목록

### Week 6

#### Frontend (A)
- [ ] 교환 요청 수락/거절 UI (받은 요청 화면)
- [ ] `PATCH /exchanges/{id}` API 연동
- [ ] 교환 완료 버튼 및 `PATCH /exchanges/{id}/complete` 연동
- [ ] 교환 상태 배지 컴포넌트 (`PENDING` / `ACCEPTED` / `COMPLETED`)

#### Backend (B)
- [ ] `PATCH /exchanges/{id}` — 수락/거절 처리
- [ ] 수락 시 채팅방 자동 생성 로직
- [ ] `PATCH /exchanges/{id}/complete` — 교환 완료 처리
- [ ] 교환 완료 시 도서 상태(`EXCHANGED`) 자동 변경
- [ ] Exchange Service 단위 테스트

---

## Week 7~8 — 채팅 + 알림 (M4)

### Week 7

#### Frontend (A)
- [ ] 채팅방 목록 화면 UI
- [ ] `GET /chat/rooms` API 연동
- [ ] 채팅 화면 UI (말풍선, 날짜 구분선, 메시지 입력창)
- [ ] `GET /chat/rooms/{id}/messages` API 연동 (커서 페이지네이션)

#### Backend (B)
- [ ] `chat_rooms`, `messages` 테이블 마이그레이션 + Entity
- [ ] `GET /chat/rooms` — 채팅방 목록 (마지막 메시지, 읽지 않은 수)
- [ ] `GET /chat/rooms/{id}/messages` — 메시지 내역 (커서 기반)
- [ ] WebSocket STOMP 서버 설정 (`/ws` 엔드포인트)

### Week 8

#### Frontend (A)
- [ ] STOMP 클라이언트 연결 및 구독 (`@stomp/stompjs`)
- [ ] 실시간 메시지 수신 → 채팅 화면 반영
- [ ] 메시지 발신 기능
- [ ] FCM 푸시 알림 수신 설정 (`expo-notifications`)
- [ ] 알림 목록 화면 UI + `GET /notifications` 연동

#### Backend (B)
- [ ] `/app/chat/{roomId}/send` — 메시지 발신 처리
- [ ] `/topic/chat/{roomId}` — 구독자에게 브로드캐스트
- [ ] FCM 푸시 알림 발송 로직 (채팅, 교환 요청 이벤트)
- [ ] `notifications` 테이블 + 알림 API 구현
- [ ] WebSocket JWT 인증 처리

---

## Week 9 — 독서 기록 + 프로필 (M5)

### Frontend (A)
- [ ] 독서 기록 피드 화면 UI
- [ ] 독서 기록 등록 폼 (별점, 날짜, 한줄 감상)
- [ ] `GET /reading-records`, `POST /reading-records` 연동
- [ ] 내 프로필 화면 (도서 수, 교환 수, 독서 기록 수)
- [ ] `GET /users/me`, `PATCH /users/me` 연동
- [ ] 타인 프로필 화면 `GET /users/{id}` 연동
- [ ] 프로필 이미지 업로드

### Backend (B)
- [ ] `reading_records` 테이블 마이그레이션 + Entity
- [ ] `GET /reading-records`, `POST /reading-records` 구현
- [ ] `PATCH /reading-records/{id}`, `DELETE /reading-records/{id}` 구현
- [ ] `GET /users/me`, `PATCH /users/me` 구현
- [ ] `GET /users/{id}`, `GET /users/{id}/books` 구현
- [ ] Reading 서비스 단위 테스트

---

## Week 10 — 통합 QA + 배포 (M6)

### 공통
- [ ] 전체 유저 플로우 E2E 테스트 (도서 등록 → 교환 요청 → 채팅 → 완료)
- [ ] 디자인 QA (화면 깨짐, 폰트, 컬러 통일)
- [ ] API 에러 핸들링 검증 (네트워크 오류, 인증 만료)
- [ ] Postman Collection으로 전체 엔드포인트 테스트
- [ ] 주요 버그 픽스

### Frontend (A)
- [ ] 로딩/에러/빈 상태 UI 전수 점검
- [ ] 오프라인 처리 검증
- [ ] iOS / Android 기기 별 UI 검증
- [ ] Expo EAS Build 프로덕션 빌드
- [ ] App Store / Play Store 스토어 제출

### Backend (B)
- [ ] Railway 프로덕션 배포 최종 확인
- [ ] 환경 변수 운영 값 세팅
- [ ] Swagger 문서 최종 검수
- [ ] 서버 응답 속도 점검 (주요 API 1초 이내 목표)
- [ ] 로그 설정 확인 (오류 추적 가능 여부)

---

## 주간 체크인 기준

매주 금요일 기준으로 아래 항목 확인:

| 항목 | 확인 방법 |
|------|---------|
| 기능 완성 여부 | GitHub PR 머지 여부 |
| API 연동 여부 | Postman / Swagger 호출 성공 |
| 빌드 통과 여부 | GitHub Actions 결과 |
| 다음 주 작업 싱크 | 짧은 미팅 또는 이슈 정리 |
