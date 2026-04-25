# PageMate API 명세서 v1.1

| 항목 | 내용 |
|------|------|
| Base URL | `https://api.pagemate.app/v1` |
| 인증 방식 | Bearer JWT (`Authorization: Bearer {accessToken}`) |
| 응답 형식 | JSON |
| 문서화 | Swagger UI `/swagger-ui.html` |

> **v1.0 → v1.1 변경 요약**
> - User 모델에 `handle`, `bio`, `location`, `joinedAt`, `tags` 추가 (ProfileScreen 반영)
> - Book 모델에 `coverColor`, `distance` 추가 (홈 근거리 탐색 반영)
> - `GET /books` 위치 기반 파라미터(`lat`, `lng`) 추가
> - `POST /exchanges` 에 `offeredBookId` 추가 (교환 제안 도서)
> - Reading Record 에 `imageUrl` 추가
> - Exchange status 값 정리 (`AVAILABLE` / `IN_PROGRESS` / `COMPLETED`)

---

## 외부 도서 검색 API — 카카오 도서 검색

> 도서 등록 시 제목/저자 키워드로 책을 검색하여 정보를 자동 완성합니다.
> **FE API 키 노출 방지를 위해 BE가 프록시합니다.**

### 카카오 도서 검색 API 스펙

| 항목 | 내용 |
|------|------|
| 원본 엔드포인트 | `GET https://dapi.kakao.com/v3/search/book` |
| 인증 | `Authorization: KakaoAK {REST_API_KEY}` (BE 서버에서만 보유) |
| 일일 한도 | 300,000건 |
| 데이터 | 제목, 저자, ISBN, 출판사, 표지 이미지 URL, 줄거리 |

### PageMate 프록시 엔드포인트

#### GET `/books/search/kakao` — 카카오 도서 검색 (프록시)

**Headers** — `Authorization` 필요

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | string | Y | 검색어 (제목, 저자 키워드) |
| `page` | int | N | 페이지 번호 (기본값: 1) |
| `size` | int | N | 결과 수 (기본값: 10, 최대: 50) |

**Response**
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "title": "채식주의자",
        "authors": ["한강"],
        "publisher": "창비",
        "isbn": "9788936433598",
        "thumbnail": "https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=...",
        "contents": "줄거리 요약...",
        "datetime": "2007-10-30"
      }
    ],
    "totalCount": 3,
    "isEnd": true
  }
}
```

### 도서 등록 UX 흐름

```
[도서 등록 화면]
├── 📷 바코드 스캔 (expo-camera)
│       → ISBN 자동 추출 → query로 검색
└── 🔍 제목/저자 키워드 입력
        ↓
GET /books/search/kakao?query={keyword}
        ↓
검색 결과 목록에서 선택
        ↓
자동 완성: 제목, 저자, 출판사, thumbnail URL
        ↓
사용자 직접 입력: 도서 상태, 한줄 소개, (선택) 직접 촬영한 사진
        ↓
POST /books  ← thumbnail URL을 imageUrl로 저장 (파일 복사 X)
```

### 표지 이미지 저장 정책

- 카카오 `thumbnail` URL을 DB에 **URL 그대로 저장** (이미지 파일 S3 복사 금지 — 약관)
- 사용자가 직접 촬영한 사진은 S3에 업로드하여 저장 (우선순위 높음)
- FE에서 이미지 로드 실패 시 `coverColor` 기반 gradient placeholder로 fallback

```
imageUrl 우선순위:
1. 사용자 직접 업로드 이미지 (S3 URL)
2. 카카오 thumbnail URL
3. coverColor gradient placeholder (FE 렌더링)
```

---

## 공통 응답 포맷

```json
// 성공
{
  "success": true,
  "data": { ... },
  "error": null
}

// 실패
{
  "success": false,
  "data": null,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "해당 도서를 찾을 수 없습니다."
  }
}
```

## 공통 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 접근 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 요청 값 검증 실패 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## 1. 인증 (Auth)

### POST `/auth/oauth/kakao` — 카카오 로그인

**Request Body**
```json
{
  "authorizationCode": "string"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "accessTokenExpiresIn": 3600,
    "user": {
      "id": 1,
      "nickname": "책방나그네",
      "handle": "@bookworm_j",
      "profileImage": "https://cdn.pagemate.app/profiles/1.jpg",
      "isNewUser": true
    }
  }
}
```

---

### POST `/auth/oauth/google` — 구글 로그인

**Request Body**
```json
{
  "authorizationCode": "string"
}
```

**Response** — 카카오 로그인과 동일

---

### POST `/auth/refresh` — 액세스 토큰 재발급

**Request Body**
```json
{
  "refreshToken": "string"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "accessTokenExpiresIn": 3600
  }
}
```

---

### POST `/auth/logout` — 로그아웃

**Headers** — `Authorization: Bearer {accessToken}` 필요

**Response**
```json
{
  "success": true,
  "data": null
}
```

---

## 2. 도서 (Books)

### 도서 상태(status) 값 정의

| 값 | 한국어 | 설명 |
|----|--------|------|
| `AVAILABLE` | 교환가능 | 교환 요청 받을 수 있는 상태 |
| `IN_PROGRESS` | 교환중 | 교환 요청 수락 후 진행 중 |
| `COMPLETED` | 교환완료 | 교환이 완료된 도서 |

### 도서 컨디션(condition) 값 정의

| 값 | 한국어 | 설명 |
|----|--------|------|
| `LIKE_NEW` | 상 | 거의 새 책 수준 |
| `GOOD` | 중 | 읽은 흔적 있으나 깨끗함 |
| `ACCEPTABLE` | 하 | 메모·밑줄 등 사용감 있음 |

### 도서 커버 색상(coverColor) 값 정의

FE `PMBookCover` 컴포넌트에서 imageUrl이 없을 때 gradient placeholder로 사용합니다.

| 값 | 설명 |
|----|------|
| `blue` | Book Blue 계열 |
| `orange` | Warm Orange 계열 |
| `sage` | 세이지 그린 계열 |
| `plum` | 플럼 퍼플 계열 |
| `sand` | 샌드 베이지 계열 |
| `ink` | 딥 인크 계열 |

---

### GET `/books` — 도서 목록 조회 (검색/필터/위치 기반)

**Headers** — 선택적 (비로그인 조회 가능)

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `keyword` | string | N | 제목, 저자, ISBN 검색어 |
| `genre` | string | N | 장르 필터 (`소설`, `에세이`, `자기계발`, `SF`, `인문`, `시`) |
| `condition` | string | N | 컨디션 (`LIKE_NEW` / `GOOD` / `ACCEPTABLE`) |
| `lat` | double | N | 현재 위치 위도 (위치 기반 정렬 시 필요) |
| `lng` | double | N | 현재 위치 경도 (위치 기반 정렬 시 필요) |
| `radiusKm` | double | N | 검색 반경 km (기본값: 2.0) |
| `page` | int | N | 페이지 번호 (기본값: 0) |
| `size` | int | N | 페이지 크기 (기본값: 20, 최대: 50) |
| `sort` | string | N | 정렬 기준 (`LATEST` / `DISTANCE`) |

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "채식주의자",
        "author": "한강",
        "genre": "소설",
        "condition": "GOOD",
        "imageUrl": "https://cdn.pagemate.app/books/1.jpg",
        "coverColor": "plum",
        "owner": {
          "id": 2,
          "nickname": "책방나그네",
          "profileImage": "https://cdn.pagemate.app/profiles/2.jpg"
        },
        "status": "AVAILABLE",
        "distance": 0.4,
        "createdAt": "2026-04-25T10:00:00Z"
      }
    ],
    "totalElements": 142,
    "totalPages": 8,
    "currentPage": 0,
    "hasNext": true
  }
}
```

> `distance`: `lat`/`lng` 파라미터 제공 시에만 포함. 단위 km.

---

### POST `/books` — 도서 등록

**Headers** — `Authorization` 필요

**Request Body** (`multipart/form-data`)
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | string | Y | 도서 제목 |
| `author` | string | Y | 저자 |
| `isbn` | string | N | ISBN |
| `genre` | string | Y | 장르 |
| `condition` | string | Y | 컨디션 (`LIKE_NEW` / `GOOD` / `ACCEPTABLE`) |
| `description` | string | N | 한줄 소개 (최대 200자) |
| `coverColor` | string | N | 커버 색상 (기본값: `sage`) |
| `image` | file | N | 도서 이미지 (jpg/png, 최대 5MB) |
| `kakaoThumbnailUrl` | string | N | 카카오 검색에서 선택한 경우 thumbnail URL |

**Response**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "title": "채식주의자",
    "author": "한강",
    "isbn": "9788936433598",
    "genre": "소설",
    "condition": "GOOD",
    "description": "노벨문학상 수상작, 읽은 지 1년 됐습니다.",
    "imageUrl": "https://cdn.pagemate.app/books/15.jpg",
    "coverColor": "plum",
    "status": "AVAILABLE",
    "createdAt": "2026-04-25T11:00:00Z"
  }
}
```

---

### GET `/books/{id}` — 도서 상세 조회

**Path Parameters** — `id`: 도서 ID

**Response**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "title": "채식주의자",
    "author": "한강",
    "isbn": "9788936433598",
    "genre": "소설",
    "condition": "GOOD",
    "description": "노벨문학상 수상작, 읽은 지 1년 됐습니다.",
    "imageUrl": "https://cdn.pagemate.app/books/15.jpg",
    "coverColor": "plum",
    "status": "AVAILABLE",
    "distance": 0.4,
    "owner": {
      "id": 2,
      "nickname": "책방나그네",
      "handle": "@bookworm_j",
      "profileImage": "https://cdn.pagemate.app/profiles/2.jpg",
      "bio": "조용한 카페에서 책 읽는 시간을 좋아해요.",
      "tags": ["소설", "에세이"],
      "exchangeCount": 5,
      "bookCount": 12,
      "rating": 4.9
    },
    "createdAt": "2026-04-25T11:00:00Z"
  }
}
```

---

### PATCH `/books/{id}` — 도서 정보 수정

**Headers** — `Authorization` 필요 (본인 소유 도서만)

**Request Body** (`application/json`, 수정할 필드만 포함)
```json
{
  "condition": "ACCEPTABLE",
  "description": "수정된 소개글입니다.",
  "coverColor": "sage"
}
```

**Response** — 수정된 도서 상세 정보 반환

---

### DELETE `/books/{id}` — 도서 삭제

**Headers** — `Authorization` 필요 (본인 소유 도서만)

**Response**
```json
{
  "success": true,
  "data": null
}
```

---

### GET `/books/me` — 내 등록 도서 목록

**Headers** — `Authorization` 필요

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `status` | string | `AVAILABLE` / `IN_PROGRESS` / `COMPLETED` (없으면 전체) |
| `page`, `size` | int | 페이지네이션 |

**Response** — 도서 목록 페이지네이션 형식과 동일 (`coverColor`, `status` 포함)

---

## 3. 교환 요청 (Exchange)

### POST `/exchanges` — 교환 요청 생성

**Headers** — `Authorization` 필요

**Request Body**
```json
{
  "bookId": 15,
  "offeredBookId": 8,
  "message": "교환 희망합니다! 제가 『소년이 온다』를 제안드려요."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `bookId` | long | Y | 원하는 상대방 도서 ID |
| `offeredBookId` | long | N | 내가 제공할 도서 ID (미입력 시 내 목록에서 나중에 선택 가능) |
| `message` | string | N | 교환 요청 메시지 |

**Response**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "requestedBook": {
      "id": 15,
      "title": "채식주의자",
      "coverColor": "plum"
    },
    "offeredBook": {
      "id": 8,
      "title": "소년이 온다",
      "coverColor": "ink"
    },
    "requester": {
      "id": 3,
      "nickname": "독서광"
    },
    "owner": {
      "id": 2,
      "nickname": "책방나그네"
    },
    "status": "PENDING",
    "message": "교환 희망합니다!",
    "createdAt": "2026-04-25T12:00:00Z"
  }
}
```

**에러 케이스**
| 코드 | 설명 |
|------|------|
| `BOOK_NOT_AVAILABLE` | 교환 불가 상태의 도서 |
| `SELF_EXCHANGE` | 본인 도서에 교환 요청 |
| `DUPLICATE_REQUEST` | 이미 요청한 도서 |

---

### PATCH `/exchanges/{id}` — 요청 수락 / 거절

**Headers** — `Authorization` 필요 (도서 소유자만)

**Request Body**
```json
{
  "action": "ACCEPT"
}
```

`action` 값: `ACCEPT` | `REJECT`

**Response**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "status": "ACCEPTED",
    "chatRoomId": 3
  }
}
```

> `ACCEPT` 시 채팅방이 자동 생성되며 `chatRoomId`가 반환됩니다.

---

### PATCH `/exchanges/{id}/complete` — 교환 완료 처리

**Headers** — `Authorization` 필요 (요청자 또는 소유자)

**Response**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "status": "COMPLETED"
  }
}
```

---

### GET `/exchanges/me` — 내 교환 목록

**Headers** — `Authorization` 필요

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `role` | string | `REQUESTER` (요청한 것) / `OWNER` (받은 것) |
| `status` | string | `PENDING` / `ACCEPTED` / `REJECTED` / `COMPLETED` |
| `page`, `size` | int | 페이지네이션 |

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 7,
        "requestedBook": {
          "id": 15,
          "title": "채식주의자",
          "imageUrl": "https://cdn.pagemate.app/books/15.jpg",
          "coverColor": "plum"
        },
        "offeredBook": {
          "id": 8,
          "title": "소년이 온다",
          "coverColor": "ink"
        },
        "partner": {
          "id": 2,
          "nickname": "책방나그네"
        },
        "status": "ACCEPTED",
        "chatRoomId": 3,
        "createdAt": "2026-04-25T12:00:00Z"
      }
    ],
    "totalElements": 4,
    "totalPages": 1,
    "currentPage": 0,
    "hasNext": false
  }
}
```

---

## 4. 채팅 (Chat)

### GET `/chat/rooms` — 채팅방 목록

**Headers** — `Authorization` 필요

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "partner": {
        "id": 2,
        "nickname": "민지",
        "handle": "@minji_reads",
        "profileImage": "https://cdn.pagemate.app/profiles/2.jpg",
        "avatarColor": "blue"
      },
      "exchange": {
        "id": 7,
        "requestedBook": {
          "id": 15,
          "title": "작별하지 않는다",
          "coverColor": "plum"
        },
        "offeredBook": {
          "id": 8,
          "title": "소년이 온다",
          "coverColor": "ink"
        },
        "status": "ACCEPTED"
      },
      "lastMessage": {
        "content": "다, 한 일요일 오후 3시 합정역 어떤 가요?",
        "sentAt": "2026-04-25T14:00:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

---

### GET `/chat/rooms/{id}/messages` — 메시지 내역 조회

**Headers** — `Authorization` 필요 (채팅방 참여자만)

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `cursor` | long | 마지막으로 읽은 메시지 ID (커서 기반 페이지네이션) |
| `size` | int | 조회 개수 (기본값: 30) |

**Response**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "type": "SYSTEM",
        "content": "교환 요청이 수락되었어요 🎉",
        "sentAt": "2026-04-25T10:00:00Z"
      },
      {
        "id": 42,
        "type": "TEXT",
        "senderId": 1,
        "content": "안녕하세요, 교환 가능한가요?",
        "sentAt": "2026-04-25T10:30:00Z"
      }
    ],
    "hasNext": false,
    "nextCursor": null
  }
}
```

**메시지 type 값**
| 값 | 설명 |
|----|------|
| `TEXT` | 일반 텍스트 메시지 |
| `SYSTEM` | 시스템 메시지 (교환 수락, 장소 공유 등) |
| `IMAGE` | 이미지 메시지 |

---

## 5. 독서 기록 (Reading Records)

### GET `/reading-records` — 독서 기록 목록

**Headers** — `Authorization` 필요

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `userId` | long | 타인 기록 조회 시 (공개된 기록만) |
| `page`, `size` | int | 페이지네이션 |

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "bookTitle": "아주 희미한 빛으로도",
        "author": "최은영",
        "rating": 5,
        "memo": "오랫동안 기억에 남을 책",
        "imageUrl": "https://search1.kakaocdn.net/thumb/...",
        "coverColor": "sage",
        "isPublic": true,
        "readAt": "2026-03-15",
        "createdAt": "2026-03-16T09:00:00Z"
      }
    ],
    "totalElements": 12,
    "totalPages": 1,
    "currentPage": 0,
    "hasNext": false
  }
}
```

---

### POST `/reading-records` — 독서 기록 등록

**Headers** — `Authorization` 필요

**Request Body**
```json
{
  "bookTitle": "아주 희미한 빛으로도",
  "author": "최은영",
  "isbn": "9788936472283",
  "rating": 5,
  "memo": "오랫동안 기억에 남을 책",
  "coverColor": "sage",
  "kakaoThumbnailUrl": "https://search1.kakaocdn.net/thumb/...",
  "isPublic": true,
  "readAt": "2026-03-15"
}
```

**Response** — 등록된 독서 기록 상세 반환

---

### PATCH `/reading-records/{id}` — 독서 기록 수정

**Headers** — `Authorization` 필요 (본인 기록만)

**Request Body** — 수정할 필드만 포함

---

### DELETE `/reading-records/{id}` — 독서 기록 삭제

**Headers** — `Authorization` 필요 (본인 기록만)

---

## 6. 사용자 (Users)

### GET `/users/me` — 내 프로필 조회

**Headers** — `Authorization` 필요

**Response**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nickname": "민지",
    "handle": "@minji_reads",
    "profileImage": "https://cdn.pagemate.app/profiles/1.jpg",
    "avatarColor": "blue",
    "bio": "조용한 카페에서 책 읽는 시간을 좋아해요. 한강, 김초엽, 최은영을 자주 읽어요.",
    "location": "망원동",
    "tags": ["소설", "에세이", "SF"],
    "oauthProvider": "KAKAO",
    "bookCount": 12,
    "exchangeCount": 8,
    "readingRecordCount": 34,
    "joinedAt": "2024-06-01T00:00:00Z"
  }
}
```

---

### PATCH `/users/me` — 프로필 수정

**Headers** — `Authorization` 필요

**Request Body** (`multipart/form-data`)
| 필드 | 타입 | 설명 |
|------|------|------|
| `nickname` | string | 닉네임 (2~12자) |
| `handle` | string | 핸들 (@ 포함, 4~20자, 영문/숫자/언더스코어) |
| `bio` | string | 자기소개 (최대 100자) |
| `location` | string | 동네 (예: 망원동) |
| `tags` | string[] | 취향 태그 (최대 5개) |
| `avatarColor` | string | 아바타 색상 |
| `profileImage` | file | 프로필 이미지 (jpg/png, 최대 3MB) |

---

### GET `/users/{id}` — 타인 프로필 조회

**Response**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nickname": "민지",
    "handle": "@minji_reads",
    "profileImage": "https://cdn.pagemate.app/profiles/2.jpg",
    "avatarColor": "blue",
    "bio": "조용한 카페에서 책 읽는 시간을 좋아해요.",
    "location": "망원동",
    "tags": ["소설", "에세이", "SF"],
    "bookCount": 12,
    "exchangeCount": 8,
    "rating": 4.9,
    "joinedAt": "2024-06-01T00:00:00Z"
  }
}
```

---

### GET `/users/{id}/books` — 특정 유저 등록 도서 목록

**Query Parameters** — `page`, `size`

---

### GET `/users/{id}/reading-records` — 특정 유저 독서 기록 (공개만)

**Query Parameters** — `page`, `size`

---

## 7. 알림 (Notifications)

### GET `/notifications` — 알림 목록

**Headers** — `Authorization` 필요

**Response**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 10,
        "type": "EXCHANGE_REQUEST",
        "content": "민지님이 교환을 요청했습니다.",
        "isRead": false,
        "referenceId": 7,
        "createdAt": "2026-04-25T12:00:00Z"
      }
    ],
    "unreadCount": 3
  }
}
```

**알림 타입**
| 타입 | 설명 |
|------|------|
| `EXCHANGE_REQUEST` | 교환 요청 수신 |
| `EXCHANGE_ACCEPTED` | 교환 요청 수락됨 |
| `EXCHANGE_REJECTED` | 교환 요청 거절됨 |
| `EXCHANGE_COMPLETED` | 교환 완료 |
| `CHAT_MESSAGE` | 새 채팅 메시지 |

---

### PATCH `/notifications/{id}/read` — 알림 읽음 처리

---

### PATCH `/notifications/read-all` — 전체 알림 읽음 처리

---

## 8. WebSocket (실시간 채팅)

| 항목 | 값 |
|------|-----|
| 연결 엔드포인트 | `wss://api.pagemate.app/ws` |
| 프로토콜 | STOMP over WebSocket |
| 인증 | 연결 시 STOMP `CONNECT` 헤더에 `Authorization: Bearer {accessToken}` |

### 구독 (수신)
```
SUBSCRIBE /topic/chat/{roomId}
```

### 발행 (발신)
```
SEND /app/chat/{roomId}/send
```

**발신 메시지 형식**
```json
{
  "content": "내일 오후 3시 합정역 어때요?"
}
```

**수신 메시지 형식**
```json
{
  "id": 43,
  "roomId": 3,
  "type": "TEXT",
  "senderId": 1,
  "senderNickname": "독서광",
  "content": "내일 오후 3시 합정역 어때요?",
  "sentAt": "2026-04-25T14:00:00Z"
}
```
