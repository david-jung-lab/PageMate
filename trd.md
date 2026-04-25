# PageMate (페이지메이트)
### Technical Requirements Document (TRD) v1.0 | 2026

---

| 항목 | 내용 |
|------|------|
| 프로젝트명 | PageMate (페이지메이트) |
| 문서 유형 | Technical Requirements Document (TRD) |
| 버전 | v1.0 |
| 작성일 | 2026년 4월 |
| 타겟 플랫폼 | iOS / Android (모바일 앱) |
| 개발 인원 | 2~3명 소규모 |
| 개발 목표 | MVP 우선 출시 |

---

## 1. 기술 스택 (Tech Stack)

### 1.1 Frontend — React Native (Expo)

모바일 앱 전용(iOS/Android)으로, Expo SDK를 기반으로 빠른 개발 환경을 구성한다.

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Expo SDK | 51+ | RN 기반 모바일 앱 프레임워크 |
| React Native | 0.74+ | 크로스플랫폼 네이티브 UI |
| TypeScript | 5.x | 정적 타입, 팀 협업 안정성 확보 |
| React Navigation | v6 | 스택/탭/드로어 화면 전환 |
| TanStack Query | v5 | 서버 상태 관리, 캐싱, 동기화 |
| Zustand | v4 | 전역 클라이언트 상태 관리 |
| NativeWind | v4 | Tailwind CSS 스타일링 (RN용) |
| Zod | v3 | API 응답 스키마 검증 |
| Axios | latest | HTTP 클라이언트 |
| date-fns | v3 | 날짜 포맷 처리 |
| React Hook Form | v7 | 폼 상태 관리 및 유효성 검사 |

### 1.2 Backend — Java + Spring Boot 3

RESTful API 서버 및 WebSocket 채팅 서버를 Spring Boot 3로 구성한다.

| 기술 | 버전 | 용도 |
|------|------|------|
| Java | 21 (LTS) | 메인 언어 (Virtual Thread 활용 가능) |
| Spring Boot | 3.x | 메인 백엔드 프레임워크 |
| Spring Security | 6.x | 인증/인가, OAuth 2.0 처리 |
| Spring Data JPA | 3.x | ORM, Repository 패턴 |
| QueryDSL | 5.x | 복잡한 동적 쿼리 (검색, 필터) |
| Spring WebSocket | 3.x | STOMP 기반 실시간 채팅 |
| SpringDoc (Swagger) | 2.x | OpenAPI 3.0 자동 문서화 |
| Lombok | latest | 보일러플레이트 코드 제거 |
| MapStruct | latest | Entity ↔ DTO 변환 |
| JWT (jjwt) | 0.12+ | Access/Refresh Token 발급 |
| AWS SDK v2 | latest | S3 이미지 업로드 |
| Firebase Admin SDK | 9.x | FCM 푸시 알림 발송 |

### 1.3 Database — MySQL

| 항목 | 선택 | 비고 |
|------|------|------|
| DBMS | MySQL 8.0 | 메인 관계형 DB |
| ORM | JPA (Hibernate) | 기본 CRUD |
| 동적 쿼리 | QueryDSL | 검색/필터/정렬 |
| 마이그레이션 | Flyway | 스키마 버전 관리 |
| 로컬 환경 | Docker Compose | 팀원 환경 통일 |
| 운영 환경 (MVP) | PlanetScale | 서버리스 MySQL, 무료 티어 |
| 운영 환경 (이후) | AWS RDS (MySQL) | 스케일업 시 마이그레이션 |

### 1.4 인프라 & 외부 서비스

| 영역 | 기술 | 용도 |
|------|------|------|
| Storage | AWS S3 + CloudFront | 도서 이미지 저장 및 CDN |
| 인증 | OAuth 2.0 (카카오, 구글) | 소셜 로그인 |
| 푸시 알림 | FCM (Firebase) | Android + iOS 통합 푸시 |
| 실시간 채팅 | WebSocket (STOMP) | 1:1 채팅 |
| BE 배포 (MVP) | Railway | jar 업로드 자동 배포 |
| BE 배포 (이후) | AWS EC2 + Docker | 운영 환경 전환 |
| 앱 빌드/배포 | Expo EAS Build | iOS/Android 스토어 자동 배포 |
| CI/CD | GitHub Actions | 빌드, 테스트, 자동 배포 |

---

## 2. 프로젝트 디렉토리 구조

### 2.1 Frontend (Expo / React Native)

피처(Feature) 기반 구조로, 기능 단위 독립 개발 및 Claude Code 지시가 용이하다.

```
pagemate-app/
├── app/                      # Expo Router 기반 라우팅
│   ├── (auth)/               # 비로그인 화면 (로그인, 회원가입)
│   ├── (tabs)/               # 하단 탭 네비게이션
│   │   ├── home.tsx
│   │   ├── search.tsx
│   │   ├── chat.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── src/
│   ├── features/             # 피처 기반 모듈
│   │   ├── auth/             # 인증
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   ├── schema.ts     # Zod 스키마
│   │   │   └── types.ts
│   │   ├── books/            # 도서 등록/검색
│   │   ├── exchange/         # 교환 요청/승인
│   │   ├── chat/             # 채팅
│   │   ├── reading/          # 독서 기록
│   │   └── profile/          # 유저 프로필
│   ├── components/           # 공통 컴포넌트
│   │   └── ui/               # 재사용 UI 요소
│   ├── hooks/                # 공통 훅
│   ├── lib/
│   │   ├── api.ts            # Axios 인스턴스
│   │   ├── queryClient.ts    # TanStack Query 설정
│   │   └── storage.ts        # 토큰 저장 (SecureStore)
│   ├── store/                # Zustand 전역 스토어
│   └── constants/            # 공통 상수
├── assets/                   # 이미지, 폰트
└── app.json                  # Expo 설정
```

### 2.2 Backend (Spring Boot)

레이어드 아키텍처 기반으로 구성하며, 도메인 단위로 패키지를 분리한다.

```
pagemate-server/
├── src/main/java/com/pagemate/
│   ├── domain/               # 도메인별 패키지
│   │   ├── auth/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   └── dto/
│   │   ├── book/
│   │   ├── exchange/
│   │   ├── chat/
│   │   ├── reading/
│   │   └── user/
│   ├── global/               # 공통 설정
│   │   ├── config/           # Security, WebSocket, S3, Swagger
│   │   ├── exception/        # 전역 예외 처리
│   │   ├── response/         # 공통 응답 포맷
│   │   └── util/
│   └── PagemateApplication.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
└── src/test/                 # JUnit 단위/통합 테스트
```

---

## 3. DB 스키마 설계 (핵심 테이블)

| 테이블 | 주요 컬럼 | 설명 |
|--------|-----------|------|
| users | id, oauth_provider, oauth_id, nickname, profile_image, created_at | 사용자 계정 |
| books | id, user_id, title, author, isbn, genre, condition, description, image_url, status | 등록 도서 |
| exchange_requests | id, requester_id, book_id, owner_id, status, created_at | 교환 요청 |
| chat_rooms | id, exchange_request_id, created_at | 채팅방 |
| messages | id, room_id, sender_id, content, sent_at | 채팅 메시지 |
| reading_records | id, user_id, book_title, author, rating, memo, read_at | 독서 기록 |
| notifications | id, user_id, type, content, is_read, created_at | 알림 |

---

## 4. API 설계 원칙

### 4.1 기본 규칙

- **Base URL**: `https://api.pagemate.app/v1`
- **응답 포맷**: JSON, 공통 래퍼 구조 사용
- **인증**: Bearer Token (JWT) — `Authorization` 헤더
- **문서화**: SpringDoc(Swagger) `/swagger-ui.html` 자동 제공

```json
// 공통 응답 포맷
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 4.2 핵심 엔드포인트 목록

| 도메인 | Method | Endpoint | 설명 |
|--------|--------|----------|------|
| Auth | POST | `/auth/oauth/kakao` | 카카오 소셜 로그인 |
| Auth | POST | `/auth/oauth/google` | 구글 소셜 로그인 |
| Auth | POST | `/auth/refresh` | 토큰 재발급 |
| Books | GET | `/books` | 도서 목록 조회 (검색/필터) |
| Books | POST | `/books` | 도서 등록 |
| Books | GET | `/books/{id}` | 도서 상세 조회 |
| Books | DELETE | `/books/{id}` | 도서 삭제 |
| Exchange | POST | `/exchanges` | 교환 요청 생성 |
| Exchange | PATCH | `/exchanges/{id}` | 요청 수락/거절 |
| Exchange | GET | `/exchanges/me` | 내 교환 목록 |
| Chat | GET | `/chat/rooms` | 채팅방 목록 |
| Chat | GET | `/chat/rooms/{id}/messages` | 메시지 내역 |
| Reading | GET | `/reading-records` | 독서 기록 목록 |
| Reading | POST | `/reading-records` | 독서 기록 등록 |
| Users | GET | `/users/me` | 내 프로필 조회 |
| Users | PATCH | `/users/me` | 프로필 수정 |

---

## 5. 실시간 채팅 설계 (WebSocket / STOMP)

- **프로토콜**: WebSocket + STOMP
- **연결 엔드포인트**: `wss://api.pagemate.app/ws`
- **Subscribe (수신)**: `/topic/chat/{roomId}`
- **Publish (발신)**: `/app/chat/{roomId}/send`
- **인증**: WebSocket 연결 시 JWT를 헤더에 포함

```json
// 발신 (Client → Server)
{
  "content": "안녕하세요, 교환 가능한가요?",
  "senderId": 1
}

// 수신 (Server → Client)
{
  "messageId": 42,
  "roomId": 5,
  "senderId": 1,
  "content": "안녕하세요, 교환 가능한가요?",
  "sentAt": "2026-04-25T10:30:00Z"
}
```

---

## 6. 인증 플로우 (OAuth 2.0 + JWT)

| 단계 | 설명 |
|------|------|
| 1. 소셜 로그인 요청 | 앱에서 카카오/구글 SDK로 인가 코드 획득 |
| 2. BE 토큰 교환 | 인가 코드를 BE `/auth/oauth/{provider}`로 전달 |
| 3. 사용자 식별 | BE에서 소셜 서버에 유저 정보 요청, users 테이블 upsert |
| 4. JWT 발급 | Access Token (1시간) + Refresh Token (30일) 발급 후 반환 |
| 5. API 요청 | 모든 API 요청 시 `Authorization: Bearer {accessToken}` 헤더 포함 |
| 6. 토큰 갱신 | Access Token 만료 시 `/auth/refresh`로 자동 재발급 |

---

## 7. 환경 변수 관리

### 7.1 Backend (`application-{env}.yml`)

```yaml
# application-prod.yml 예시
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  security:
    oauth2:
      client:
        kakao.client-id: ${KAKAO_CLIENT_ID}
        google.client-id: ${GOOGLE_CLIENT_ID}

jwt:
  secret: ${JWT_SECRET}

aws:
  s3.bucket: ${S3_BUCKET_NAME}
  access-key: ${AWS_ACCESS_KEY}
  secret-key: ${AWS_SECRET_KEY}

firebase:
  credentials-path: ${FIREBASE_CREDENTIALS_PATH}
```

### 7.2 Frontend (`.env`)

```
EXPO_PUBLIC_API_BASE_URL=https://api.pagemate.app/v1
EXPO_PUBLIC_WS_URL=wss://api.pagemate.app/ws
EXPO_PUBLIC_KAKAO_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=...
```

---

## 8. 배포 파이프라인

| 단계 | 도구 | 트리거 | 설명 |
|------|------|--------|------|
| 코드 리뷰 | GitHub PR | PR 생성 시 | 팀원 리뷰 후 main 머지 |
| BE 빌드/테스트 | GitHub Actions | main push | Gradle 빌드 + JUnit 테스트 |
| BE 배포 (MVP) | Railway | main push | jar 자동 배포 |
| 앱 빌드 | Expo EAS Build | 수동 또는 태그 | iOS/Android 동시 빌드 |
| 앱 제출 | Expo EAS Submit | 빌드 완료 후 | App Store / Play Store 자동 제출 |

---

## 9. 로컬 개발 환경 설정

### 9.1 Docker Compose (MySQL)

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: pagemate
      MYSQL_ROOT_PASSWORD: root1234
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### 9.2 초기 세팅 순서

```bash
# 1. 저장소 클론
git clone https://github.com/pagemate/pagemate-app
git clone https://github.com/pagemate/pagemate-server

# 2. DB 실행
docker compose up -d

# 3. BE 실행
cd pagemate-server
./gradlew bootRun --args='--spring.profiles.active=dev'

# 4. FE 실행
cd pagemate-app
npm install
npx expo start
```

---

## 10. 테스트 전략

| 레이어 | 도구 | 범위 | 목표 커버리지 |
|--------|------|------|--------------|
| BE 단위 테스트 | JUnit 5 + Mockito | Service 레이어 핵심 로직 | 70% 이상 |
| BE 통합 테스트 | Spring Boot Test | Controller → DB 전체 흐름 | 핵심 API 전수 |
| FE 컴포넌트 테스트 | Jest + Testing Library | 공통 UI 컴포넌트 | 주요 컴포넌트 |
| E2E 테스트 | Detox | 교환 요청, 채팅 핵심 플로우 | 핵심 시나리오 |
| API 테스트 | Postman Collection | 전체 엔드포인트 | Swagger 기준 전수 |

---

## 11. 보안 고려사항

- JWT Refresh Token은 `HttpOnly Cookie` 또는 `SecureStore`(Expo)에 저장, localStorage 금지
- AWS S3 버킷은 퍼블릭 액세스 차단, CloudFront를 통해서만 이미지 제공
- OAuth Client Secret은 BE에서만 관리, FE에 노출 금지
- API 전체에 HTTPS 강제 (HTTP 요청은 BE에서 리다이렉트)
- 입력값 검증: BE에서 `@Valid` 어노테이션, FE에서 Zod 스키마 이중 검증
- 민감 정보(전화번호 등) DB 암호화 저장

---

## 12. Claude Code 이관 가이드

### CLAUDE.md 필수 포함 내용

- 프로젝트 개요 및 기술 스택 요약
- 디렉토리 구조 및 피처 분리 규칙
- API Base URL 및 공통 응답 포맷
- 코드 컨벤션 (네이밍, 파일명, import 순서)
- Swagger URL 및 주요 엔드포인트 목록

### Claude Code 지시 패턴 (권장)

- 피처 단위로 분리하여 지시: `"books 피처 구현해줘 + ERD + API 스펙 첨부"`
- 컨텍스트 명시: `"Spring Boot 3, JPA, QueryDSL 기준으로"`
- 결과물 범위 지정: `"Controller, Service, Repository, DTO, Entity 모두 생성"`
- 테스트 동시 요청: `"JUnit 테스트 코드도 함께 작성해줘"`