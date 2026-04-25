# PageMate API 명세서 v1.0

| 항목 | 내용 |
|------|------|
| Base URL | `https://api.pagemate.app/v1` |
| 인증 방식 | Bearer JWT (`Authorization: Bearer {accessToken}`) |
| 응답 형식 | JSON |
| 문서화 | Swagger UI `/swagger-ui.html` |

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

### GET `/books` — 도서 목록 조회 (검색/필터)

**Headers** — 선택적 (비로그인 조회 가능)

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `keyword` | string | N | 제목, 저자, ISBN 검색어 |
| `genre` | string | N | 장르 필터 (`소설`, `에세이`, `자기계발`, ...) |
| `condition` | string | N | 도서 상태 (`LIKE_NEW`, `GOOD`, `ACCEPTABLE`) |
| `page` | int | N | 페이지 번호 (기본값: 0) |
| `size` | int | N | 페이지 크기 (기본값: 20, 최대: 50) |
| `sort` | string | N | 정렬 기준 (`LATEST`, `POPULAR`) |

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
        "owner": {
          "id": 2,
          "nickname": "책방나그네",
          "profileImage": "https://cdn.pagemate.app/profiles/2.jpg"
        },
        "status": "AVAILABLE",
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
| `condition` | string | Y | 상태 (`LIKE_NEW` / `GOOD` / `ACCEPTABLE`) |
| `description` | string | N | 한줄 소개 (최대 200자) |
| `image` | file | N | 도서 이미지 (jpg/png, 최대 5MB) |

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
    "status": "AVAILABLE",
    "owner": {
      "id": 2,
      "nickname": "책방나그네",
      "profileImage": "https://cdn.pagemate.app/profiles/2.jpg",
      "exchangeCount": 5
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
  "description": "수정된 소개글입니다."
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

**Query Parameters** — `page`, `size` (공통)

**Response** — 도서 목록 페이지네이션 형식과 동일

---

## 3. 교환 요청 (Exchange)

### POST `/exchanges` — 교환 요청 생성

**Headers** — `Authorization` 필요

**Request Body**
```json
{
  "bookId": 15,
  "message": "교환 희망합니다! 제가 가진 책 목록 확인해 주세요."
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "book": {
      "id": 15,
      "title": "채식주의자"
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
    "message": "교환 희망합니다! 제가 가진 책 목록 확인해 주세요.",
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
        "book": {
          "id": 15,
          "title": "채식주의자",
          "imageUrl": "https://cdn.pagemate.app/books/15.jpg"
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
        "nickname": "책방나그네",
        "profileImage": "https://cdn.pagemate.app/profiles/2.jpg"
      },
      "book": {
        "id": 15,
        "title": "채식주의자"
      },
      "lastMessage": {
        "content": "내일 오후 2시 어때요?",
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
        "id": 42,
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
        "bookTitle": "채식주의자",
        "author": "한강",
        "rating": 5,
        "memo": "오랫동안 기억에 남을 책",
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
  "bookTitle": "채식주의자",
  "author": "한강",
  "rating": 5,
  "memo": "오랫동안 기억에 남을 책",
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
    "nickname": "독서광",
    "profileImage": "https://cdn.pagemate.app/profiles/1.jpg",
    "oauthProvider": "KAKAO",
    "bookCount": 5,
    "exchangeCount": 3,
    "readingRecordCount": 12,
    "createdAt": "2026-04-01T00:00:00Z"
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
| `profileImage` | file | 프로필 이미지 (jpg/png, 최대 3MB) |

---

### GET `/users/{id}` — 타인 프로필 조회

**Response** — 공개 정보 (닉네임, 프로필 이미지, 교환 횟수, 공개 독서 기록) 반환

---

### GET `/users/{id}/books` — 특정 유저 등록 도서 목록

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
        "content": "책방나그네님이 교환을 요청했습니다.",
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
  "content": "내일 오후 2시 어때요?"
}
```

**수신 메시지 형식**
```json
{
  "id": 43,
  "roomId": 3,
  "senderId": 1,
  "senderNickname": "독서광",
  "content": "내일 오후 2시 어때요?",
  "sentAt": "2026-04-25T14:00:00Z"
}
```
