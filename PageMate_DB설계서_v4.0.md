# PageMate DB 설계서
### Database Design Document v4.0 | 2026

---

| 항목 | 내용 |
|------|------|
| DBMS | MySQL 8.0 |
| ORM | JPA (Hibernate) + QueryDSL |
| 마이그레이션 | Flyway |
| 버전 | v4.0 |
| 변경 내용 | neighborhood 컬럼 추가 / exchange_requests에 selected_book_id 추가 / condition 없음 / image_url 카카오 URL만 |

---

## 1. ERD 개요

```
users
 ├── books (1:N)
 ├── exchange_requests (1:N, requester/owner)
 ├── exchange_pledges (1:N)
 ├── user_reviews (1:N)
 ├── notifications (1:N)
 └── fcm_tokens (1:N)

exchange_requests
 ├── chat_rooms (1:1)
 ├── exchange_pledges (1:2)
 └── user_reviews (1:2)

chat_rooms
 └── messages (1:N)

neighborhood_relations (인접 동네 관계 테이블)
```

---

## 2. 테이블 정의

### 2.1 users

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| oauth_provider | VARCHAR(20) | NOT NULL | GOOGLE / KAKAO |
| oauth_id | VARCHAR(100) | NOT NULL | 소셜 고유 ID |
| nickname | VARCHAR(10) | NOT NULL, UNIQUE | |
| bio | VARCHAR(100) | NULL | 한줄 소개 |
| genres | JSON | NULL | 취향 장르 목록 |
| neighborhood | VARCHAR(50) | NULL | 동네명 (동 단위, 예: 망원동) |
| average_rating | DECIMAL(3,2) | DEFAULT 0.00 | |
| review_count | INT | DEFAULT 0 | |
| is_active | TINYINT(1) | DEFAULT 1 | |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

```sql
UNIQUE INDEX idx_users_oauth (oauth_provider, oauth_id)
UNIQUE INDEX idx_users_nickname (nickname)
INDEX idx_users_neighborhood (neighborhood)
```

---

### 2.2 books

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id | 등록자 |
| title | VARCHAR(200) | NOT NULL | |
| author | VARCHAR(100) | NOT NULL | |
| isbn | VARCHAR(20) | NULL | |
| genre | VARCHAR(30) | NOT NULL | |
| description | VARCHAR(300) | NULL | 한줄 소개 |
| image_url | VARCHAR(500) | NULL | 카카오 API 표지 URL |
| neighborhood | VARCHAR(50) | NOT NULL | 동네명 |
| status | ENUM | DEFAULT 'AVAILABLE' | AVAILABLE / IN_EXCHANGE / UNAVAILABLE |
| is_deleted | TINYINT(1) | DEFAULT 0 | 소프트 삭제 |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

```sql
INDEX idx_books_user_id (user_id)
INDEX idx_books_neighborhood (neighborhood)
INDEX idx_books_genre_status (genre, status)
FULLTEXT INDEX idx_books_search (title, author)
```

---

### 2.3 neighborhood_relations (인접 동네 관계) ★ 신규

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| neighborhood | VARCHAR(50) | NOT NULL | 기준 동네 |
| adjacent_neighborhood | VARCHAR(50) | NOT NULL | 인접 동네 |
| distance_level | TINYINT | NOT NULL | 1: 가까운 동네 / 2: 조금 더 멀리 |

```sql
INDEX idx_nbr_neighborhood (neighborhood)
UNIQUE INDEX idx_nbr_pair (neighborhood, adjacent_neighborhood)
```

**탐색 범위별 쿼리 패턴**
```sql
-- 내 동네만 (range=mine)
WHERE b.neighborhood = :myNeighborhood

-- 가까운 동네 (range=near)
WHERE b.neighborhood = :myNeighborhood
  OR b.neighborhood IN (
    SELECT adjacent_neighborhood FROM neighborhood_relations
    WHERE neighborhood = :myNeighborhood AND distance_level = 1
  )

-- 조금 더 멀리 (range=wider)
WHERE b.neighborhood = :myNeighborhood
  OR b.neighborhood IN (
    SELECT adjacent_neighborhood FROM neighborhood_relations
    WHERE neighborhood = :myNeighborhood AND distance_level <= 2
  )
```

---

### 2.4 exchange_requests

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| requester_id | BIGINT | FK → users.id | 요청자 |
| owner_id | BIGINT | FK → users.id | 수신자 |
| target_book_id | BIGINT | FK → books.id | 요청자가 원하는 책 |
| selected_book_id | BIGINT | FK → books.id, NULL | 수신자가 선택한 책 (수락 시 설정) |
| status | ENUM | DEFAULT 'REQUESTED' | REQUESTED/ACCEPTED/PLEDGED/SCHEDULED/FIRST_EXCHANGED/SECOND_EXCHANGED/COMPLETED/REJECTED/CANCELLED |
| first_exchange_date | DATE | NULL | |
| first_exchange_place | VARCHAR(100) | NULL | |
| second_exchange_period_days | TINYINT | NULL | 1~30 |
| second_exchange_due_date | DATE | NULL | 자동 계산 |
| requester_first_confirmed | TINYINT(1) | DEFAULT 0 | |
| owner_first_confirmed | TINYINT(1) | DEFAULT 0 | |
| requester_second_confirmed | TINYINT(1) | DEFAULT 0 | |
| owner_second_confirmed | TINYINT(1) | DEFAULT 0 | |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

```sql
INDEX idx_exchange_requester (requester_id)
INDEX idx_exchange_owner (owner_id)
INDEX idx_exchange_status (status)
INDEX idx_exchange_due_date (second_exchange_due_date)
```

---

### 2.5 exchange_pledges

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| exchange_id | BIGINT | FK → exchange_requests.id | |
| user_id | BIGINT | FK → users.id | |
| agreed_at | DATETIME | DEFAULT NOW() | |

```sql
UNIQUE INDEX idx_pledge_exchange_user (exchange_id, user_id)
```

---

### 2.6 user_reviews

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| exchange_id | BIGINT | FK → exchange_requests.id | |
| reviewer_id | BIGINT | FK → users.id | |
| reviewee_id | BIGINT | FK → users.id | |
| rating | TINYINT | NOT NULL | 1~5 |
| comment | VARCHAR(100) | NULL | |
| created_at | DATETIME | DEFAULT NOW() | |

```sql
UNIQUE INDEX idx_review_exchange_reviewer (exchange_id, reviewer_id)
INDEX idx_review_reviewee (reviewee_id)
```

---

### 2.7 chat_rooms

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| exchange_id | BIGINT | FK → exchange_requests.id | |
| user1_id | BIGINT | FK → users.id | |
| user2_id | BIGINT | FK → users.id | |
| created_at | DATETIME | DEFAULT NOW() | |

```sql
UNIQUE INDEX idx_chatroom_exchange (exchange_id)
```

---

### 2.8 messages

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| room_id | BIGINT | FK → chat_rooms.id | |
| sender_id | BIGINT | FK → users.id | |
| content | TEXT | NOT NULL | |
| type | ENUM | DEFAULT 'TEXT' | TEXT / SYSTEM |
| is_read | TINYINT(1) | DEFAULT 0 | |
| sent_at | DATETIME | DEFAULT NOW() | |

```sql
INDEX idx_messages_room_sent (room_id, sent_at)
```

---

### 2.9 notifications

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id | |
| type | VARCHAR(50) | NOT NULL | |
| content | VARCHAR(300) | NOT NULL | |
| action_data | JSON | NULL | exchangeId 등 |
| is_read | TINYINT(1) | DEFAULT 0 | |
| created_at | DATETIME | DEFAULT NOW() | |

```sql
INDEX idx_noti_user_read (user_id, is_read)
```

---

### 2.10 fcm_tokens

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | BIGINT | FK → users.id | |
| token | VARCHAR(500) | NOT NULL | |
| device_type | VARCHAR(10) | NOT NULL | ANDROID / IOS |
| created_at | DATETIME | DEFAULT NOW() | |
| updated_at | DATETIME | ON UPDATE NOW() | |

```sql
INDEX idx_fcm_user_id (user_id)
```

---

## 3. Flyway 마이그레이션 구조

```
V1__create_users.sql
V2__create_books.sql
V3__create_neighborhood_relations.sql
V4__create_exchange_requests.sql
V5__create_exchange_pledges.sql
V6__create_user_reviews.sql
V7__create_chat_rooms.sql
V8__create_messages.sql
V9__create_notifications.sql
V10__create_fcm_tokens.sql
```

---

## 4. 주요 쿼리

### 4.1 1차 교환 완료 + due_date 자동 계산

```sql
UPDATE exchange_requests
SET status = 'FIRST_EXCHANGED',
    second_exchange_period_days = :days,
    second_exchange_due_date = DATE_ADD(CURDATE(), INTERVAL :days DAY)
WHERE id = :exchangeId
  AND requester_first_confirmed = 1
  AND owner_first_confirmed = 1;
```

### 4.2 2차 교환 기한 도래 (스케줄러)

```sql
SELECT * FROM exchange_requests
WHERE status = 'FIRST_EXCHANGED'
  AND second_exchange_due_date IN (
    CURDATE() + INTERVAL 3 DAY,
    CURDATE() + INTERVAL 1 DAY,
    CURDATE()
  );
```

### 4.3 사용자 평점 갱신

```sql
UPDATE users
SET average_rating = (SELECT AVG(rating) FROM user_reviews WHERE reviewee_id = :id),
    review_count   = (SELECT COUNT(*) FROM user_reviews WHERE reviewee_id = :id)
WHERE id = :id;
```
