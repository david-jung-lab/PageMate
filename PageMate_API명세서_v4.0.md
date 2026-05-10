# PageMate API 명세서
### API Specification v4.0 | 2026

---

| 항목 | 내용 |
|------|------|
| Base URL | `https://api.pagemate.app/v1` |
| 인증 방식 | Bearer Token (JWT) |
| 응답 형식 | JSON |
| 버전 | v4.0 |

---

## 공통 응답 포맷

```json
// 성공
{ "success": true, "data": { ... }, "error": null }

// 실패
{ "success": false, "data": null,
  "error": { "code": "BOOK_NOT_FOUND", "message": "도서를 찾을 수 없어요." } }
```

## 공통 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| UNAUTHORIZED | 401 | 인증 토큰 없음/만료 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| DUPLICATE_REQUEST | 409 | 중복 요청 |
| INVALID_STATUS | 409 | 현재 상태에서 불가 |
| PLEDGE_NOT_AGREED | 403 | 약속문 미동의 |
| ALREADY_REVIEWED | 409 | 이미 평가 완료 |
| INTERNAL_ERROR | 500 | 서버 오류 |

---

## 1. 인증 API

### POST /auth/oauth/google
```json
// Request
{ "idToken": "구글_ID_토큰" }
// Response
{ "accessToken": "...", "refreshToken": "...", "isNewUser": true }
```

### POST /auth/oauth/kakao
```json
// Request
{ "accessToken": "카카오_액세스_토큰" }
// Response
{ "accessToken": "...", "refreshToken": "...", "isNewUser": false }
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "..." }
// Response
{ "accessToken": "..." }
```

### POST /auth/logout

---

## 2. 사용자 API

### GET /users/me
```json
{
  "id": 1, "nickname": "민지", "bio": "소설을 좋아합니다",
  "genres": ["소설", "에세이"], "neighborhood": "망원동",
  "bookCount": 5, "exchangeCount": 8,
  "averageRating": 4.8, "reviewCount": 8
}
```

### PATCH /users/me
```json
// Request
{ "nickname": "민지", "bio": "소설을 좋아합니다",
  "genres": ["소설", "에세이"], "neighborhood": "망원동" }
```

### GET /users/{userId}
```json
{
  "id": 2, "nickname": "현우", "bio": "SF 마니아",
  "genres": ["SF", "인문"], "neighborhood": "합정동",
  "bookCount": 12, "exchangeCount": 15,
  "averageRating": 4.5, "reviewCount": 14
}
```

### POST /users/me/fcm-token
```json
{ "fcmToken": "FCM_디바이스_토큰" }
```

---

## 3. 도서 API

### GET /books
**Query Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| keyword | string | 검색 키워드 (전국) |
| genre | string | 장르 필터 |
| sort | string | latest (기본) |
| neighborhood | string | 동네 필터 (홈 탐색용) |
| range | string | mine / near / wider (탐색 범위) |
| page | number | 페이지 번호 |
| size | number | 페이지 크기 (기본 20) |

```json
// Response
{
  "content": [
    {
      "id": 1, "title": "작별하지 않는다", "author": "한강",
      "genre": "소설", "imageUrl": "https://...",
      "neighborhood": "망원동", "ownerNickname": "민지",
      "ownerRating": 4.8, "status": "AVAILABLE"
    }
  ],
  "totalElements": 10, "totalPages": 1, "currentPage": 0
}
```

### GET /books/recent
최근 등록된 책 전국 조회 (홈 하단 섹션용)

### GET /books/my
내 등록 도서 목록 (교환 요청 수신 시 노출용)

### POST /books
**Request** (application/json)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | Y | 도서 제목 |
| author | string | Y | 저자 |
| isbn | string | N | ISBN |
| genre | string | Y | 장르 |
| imageUrl | string | N | 카카오 API 표지 URL |
| neighborhood | string | Y | 동네 (동 단위) |
| description | string | N | 한줄 소개 |

### GET /books/{bookId}
```json
{
  "id": 1, "title": "작별하지 않는다", "author": "한강",
  "genre": "소설", "description": "깨끗하게 읽었어요",
  "imageUrl": "https://...", "neighborhood": "망원동",
  "status": "AVAILABLE",
  "owner": {
    "id": 2, "nickname": "민지",
    "genres": ["소설", "에세이"], "averageRating": 4.8, "reviewCount": 8
  }
}
```

### PATCH /books/{bookId}
### DELETE /books/{bookId}

---

## 4. 교환독서 API

### POST /exchanges
교환독서 요청 발송 (줄 책 선택 없음)

```json
// Request
{ "targetBookId": 1 }

// Response
{
  "id": 10, "status": "REQUESTED",
  "targetBook": { "id": 1, "title": "작별하지 않는다" }
}
```

### GET /exchanges/{exchangeId}/requester-books
수신자가 요청자 도서 목록 조회

```json
// Response
{
  "requesterBooks": [
    { "id": 3, "title": "데미안", "author": "헤르만 헤세",
      "genre": "소설", "imageUrl": "...", "neighborhood": "합정동" }
  ]
}
```

### PATCH /exchanges/{exchangeId}/respond
수락 시 선택한 책 ID 포함

```json
// Request
{ "action": "ACCEPT", "selectedBookId": 3 }
// action: ACCEPT / REJECT
```

### POST /exchanges/{exchangeId}/pledge
약속문 동의

```json
// Response
{ "id": 10, "status": "PLEDGED",
  "myPledged": true, "partnerPledged": true, "chatRoomId": 5 }
```

### PATCH /exchanges/{exchangeId}/schedule
1차 교환 날짜/장소 확정

```json
// Request
{ "firstExchangeDate": "2026-05-01", "firstExchangePlace": "홍대 스타벅스" }
```

### PATCH /exchanges/{exchangeId}/first-complete
1차 교환 완료 + 2차 기간 설정

```json
// Request
{ "secondExchangePeriodDays": 7 }
// 1~30일, due_date = 완료일 + N일 자동 계산

// Response
{
  "id": 10, "status": "FIRST_EXCHANGED",
  "myConfirmed": true, "partnerConfirmed": false,
  "secondExchangeDueDate": "2026-05-08"
}
```

### PATCH /exchanges/{exchangeId}/second-complete
2차 교환 완료

```json
// Response
{ "id": 10, "status": "SECOND_EXCHANGED",
  "myConfirmed": true, "partnerConfirmed": true }
```

### GET /exchanges/me
```json
{
  "content": [
    {
      "id": 10, "partnerNickname": "현우", "partnerRating": 4.5,
      "myBook": { "id": 3, "title": "데미안" },
      "partnerBook": { "id": 1, "title": "작별하지 않는다" },
      "status": "FIRST_EXCHANGED",
      "firstExchangeDate": "2026-05-01",
      "secondExchangeDueDate": "2026-05-08"
    }
  ]
}
```

---

## 5. 사용자 평가 API

### POST /exchanges/{exchangeId}/reviews
```json
// Request
{ "rating": 5, "comment": "약속을 잘 지키셨어요" }
```

### GET /users/{userId}/reviews
```json
{
  "averageRating": 4.8, "reviewCount": 8,
  "reviews": [
    { "id": 1, "reviewerNickname": "민지",
      "rating": 5, "comment": "약속을 잘 지키셨어요",
      "createdAt": "2026-05-16T10:00:00Z" }
  ]
}
```

---

## 6. 채팅 API

### GET /chat/rooms
```json
[
  {
    "id": 5, "exchangeId": 10,
    "partnerNickname": "현우",
    "myBookTitle": "데미안",
    "partnerBookTitle": "작별하지 않는다",
    "secondExchangeDueDate": "2026-05-08",
    "lastMessage": "내일 2시에 홍대 어때요?",
    "lastMessageAt": "2026-04-25T10:30:00Z",
    "unreadCount": 2
  }
]
```

### GET /chat/rooms/{roomId}/messages
```json
{
  "content": [
    { "id": 42, "senderId": 1, "senderNickname": "민지",
      "content": "내일 2시에 홍대 어때요?",
      "type": "TEXT", "sentAt": "2026-04-25T10:30:00Z" }
  ]
}
```

### WebSocket 채팅
**연결**: `wss://api.pagemate.app/ws`
**Subscribe**: `/topic/chat/{roomId}`
**Publish**: `/app/chat/{roomId}/send`

```json
// 발신
{ "content": "내일 2시에 홍대 어때요?" }

// 수신
{ "messageId": 42, "roomId": 5, "senderId": 1,
  "senderNickname": "민지", "content": "내일 2시에 홍대 어때요?",
  "type": "TEXT", "sentAt": "2026-04-25T10:30:00Z" }
```

---

## 7. 알림 API

### GET /notifications
```json
[
  { "id": 1, "type": "EXCHANGE_REQUEST",
    "content": "민지님이 교환독서를 요청했어요",
    "isRead": false, "createdAt": "2026-04-25T10:00:00Z",
    "actionData": { "exchangeId": 10 } }
]
```

### PATCH /notifications/{notificationId}/read
### PATCH /notifications/read-all
