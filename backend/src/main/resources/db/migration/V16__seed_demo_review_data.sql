-- ─────────────────────────────────────────────────────────────────────────────
-- Apple App Store 심사용 데모 계정 + 샘플 데이터 시드
--
-- 심사관은 로그인 화면의 "둘러보기(체험 계정)" 버튼 → POST /v1/auth/demo 로
-- 아래 demo-reviewer-apple 계정에 즉시 로그인한다. (AuthService.DEMO_OAUTH_ID 와 일치)
--
-- 운영 DB에 이미 실제 사용자 데이터가 있을 수 있으므로, 하드코딩 PK 대신
-- LAST_INSERT_ID() 로 auto_increment id를 세션 변수에 담아 FK를 연결한다.
-- Flyway가 이 마이그레이션을 정확히 1회만 실행하므로 별도 중복 방지 가드는 불필요하다.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 사용자 ───────────────────────────────────────────────────────────────────
-- 데모 심사 계정 (심사관이 로그인하는 본인 계정)
INSERT INTO users (oauth_provider, oauth_id, email, nickname, handle, bio, avatar_color, location, is_onboarded, created_at, updated_at)
VALUES ('GOOGLE', 'demo-reviewer-apple', 'demo@pagemate.app', '민준', 'reviewer_demo',
        '책으로 사람을 만나는 걸 좋아해요. 다 읽은 책은 이웃과 나눕니다 📚', 'blue', '서울 강남구 · 역삼동',
        TRUE, NOW() - INTERVAL 30 DAY, NOW());
SET @u_demo = LAST_INSERT_ID();

INSERT INTO user_tags (user_id, tag) VALUES
    (@u_demo, '소설'), (@u_demo, '에세이'), (@u_demo, '인문사회');

-- 이웃 사용자 3명 (데모 계정이 상호작용하는 상대)
INSERT INTO users (oauth_provider, oauth_id, email, nickname, handle, bio, avatar_color, location, is_onboarded, created_at, updated_at)
VALUES ('KAKAO', 'demo-seed-seoyeon', 'seoyeon@pagemate.app', '서연', 'seoyeon_books',
        '소설과 에세이를 사랑하는 직장인이에요.', 'orange', '서울 강남구 · 삼성동',
        TRUE, NOW() - INTERVAL 28 DAY, NOW());
SET @u_sy = LAST_INSERT_ID();

INSERT INTO users (oauth_provider, oauth_id, email, nickname, handle, bio, avatar_color, location, is_onboarded, created_at, updated_at)
VALUES ('GOOGLE', 'demo-seed-dohyun', 'dohyun@pagemate.app', '도현', 'dohyun_read',
        '과학·인문 교양서를 주로 읽습니다.', 'sage', '서울 강남구 · 대치동',
        TRUE, NOW() - INTERVAL 25 DAY, NOW());
SET @u_dh = LAST_INSERT_ID();

INSERT INTO users (oauth_provider, oauth_id, email, nickname, handle, bio, avatar_color, location, is_onboarded, created_at, updated_at)
VALUES ('KAKAO', 'demo-seed-haneul', 'haneul@pagemate.app', '하늘', 'haneul_lib',
        '자기계발서 모으는 게 취미예요.', 'plum', '서울 강남구 · 청담동',
        TRUE, NOW() - INTERVAL 22 DAY, NOW());
SET @u_hn = LAST_INSERT_ID();

-- ── 도서 ─────────────────────────────────────────────────────────────────────
-- 데모 계정(민준) 소유 도서
INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '불편한 편의점', '김호연', '나무옆의자', 'novel',
        '평범한 편의점에서 펼쳐지는 따뜻한 이야기. 밑줄 하나 없이 깨끗해요.', 'sand', 'IN_PROGRESS', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 18 DAY, NOW());
SET @b_demo1 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '아몬드', '손원평', '창비', 'novel',
        '감정을 느끼지 못하는 소년의 성장기. 아껴 읽은 책입니다.', 'plum', 'COMPLETED', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 18 DAY, NOW());
SET @b_demo2 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '데미안', '헤르만 헤세', '민음사', 'novel',
        '새는 알에서 나오려고 투쟁한다. 인생 책이에요.', 'ink', 'AVAILABLE', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 15 DAY, NOW());
SET @b_demo3 = LAST_INSERT_ID();

-- 서연 소유 도서
INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '어린 왕자', '앙투안 드 생텍쥐페리', '열린책들', 'novel',
        '가장 중요한 것은 눈에 보이지 않아요.', 'blue', 'COMPLETED', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 26 DAY, NOW());
SET @b_sy1 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '미드나잇 라이브러리', '매트 헤이그', '인플루엔셜', 'novel',
        '후회 없는 삶이란 무엇일까. 강력 추천해요.', 'sage', 'IN_PROGRESS', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 20 DAY, NOW());
SET @b_sy2 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '달러구트 꿈 백화점', '이미예', '팩토리나인', 'novel',
        '잠들어야만 갈 수 있는 백화점 이야기.', 'orange', 'AVAILABLE', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 12 DAY, NOW());
SET @b_sy3 = LAST_INSERT_ID();

-- 도현 소유 도서
INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_dh, '사피엔스', '유발 하라리', '김영사', 'humanities',
        '인류의 역사를 관통하는 통찰. 상태 좋아요.', 'sage', 'AVAILABLE', '서울 강남구 · 대치동',
        NOW() - INTERVAL 24 DAY, NOW());
SET @b_dh1 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_dh, '코스모스', '칼 세이건', '사이언스북스', 'scienceSF',
        '우주와 과학에 대한 경이. 두껍지만 술술 읽혀요.', 'ink', 'AVAILABLE', '서울 강남구 · 대치동',
        NOW() - INTERVAL 21 DAY, NOW());
SET @b_dh2 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_dh, '총, 균, 쇠', '재레드 다이아몬드', '문학사상', 'humanities',
        '문명의 불균형은 어디에서 왔는가.', 'sand', 'AVAILABLE', '서울 강남구 · 대치동',
        NOW() - INTERVAL 16 DAY, NOW());
SET @b_dh3 = LAST_INSERT_ID();

-- 하늘 소유 도서
INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_hn, '역행자', '자청', '웅진지식하우스', 'selfdev',
        '평범한 사람이 자유를 얻는 법.', 'orange', 'AVAILABLE', '서울 강남구 · 청담동',
        NOW() - INTERVAL 19 DAY, NOW());
SET @b_hn1 = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_hn, '나는 나로 살기로 했다', '김수현', '마음의숲', 'essay',
        '나를 지키며 사는 법에 대한 에세이.', 'plum', 'AVAILABLE', '서울 강남구 · 청담동',
        NOW() - INTERVAL 14 DAY, NOW());
SET @b_hn2 = LAST_INSERT_ID();

-- ── 교환 ─────────────────────────────────────────────────────────────────────
-- A. 완료된 교환: 민준(요청) ↔ 서연(응답).  민준이 '어린 왕자'를 원했고, 민준의 '아몬드'를 건넴 → 완료
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       completed_at, due_date, requester_pledged, respondent_pledged,
                       first_exchange_date, first_exchange_place,
                       requester_first_confirmed, respondent_first_confirmed,
                       requester_second_confirmed, respondent_second_confirmed,
                       created_at, updated_at)
VALUES (@u_demo, @u_sy, @b_sy1, @b_demo2, 'COMPLETED', '어린 왕자 정말 읽고 싶었어요! 제 아몬드랑 교환해요 :)',
        NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 2 DAY, TRUE, TRUE,
        NOW() - INTERVAL 12 DAY, '역삼역 3번 출구 스타벅스',
        TRUE, TRUE, TRUE, TRUE,
        NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 2 DAY);
SET @ex_a = LAST_INSERT_ID();

-- B. 진행 중 교환: 서연(요청) ↔ 민준(응답).  서연이 민준의 '불편한 편의점'을 원함, 민준이 수락하며 서연의 '미드나잇 라이브러리' 선택
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       requester_pledged, respondent_pledged,
                       created_at, updated_at)
VALUES (@u_sy, @u_demo, @b_demo1, @b_sy2, 'ACCEPTED', '불편한 편의점 교환 가능할까요? 미드나잇 라이브러리 드릴게요!',
        FALSE, FALSE,
        NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY);
SET @ex_b = LAST_INSERT_ID();

-- C. 대기 중 교환: 민준(요청) → 도현.  민준이 도현의 '사피엔스'를 요청 (아직 응답 전)
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, status, message,
                       created_at, updated_at)
VALUES (@u_demo, @u_dh, @b_dh1, 'PENDING', '사피엔스 교환 원해요! 제 책 목록에서 골라주세요 :)',
        NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);
SET @ex_c = LAST_INSERT_ID();

-- ── 채팅 (진행 중 교환 B) ────────────────────────────────────────────────────
INSERT INTO chat_rooms (exchange_id, book_id, requester_id, owner_id, last_message, last_message_at, created_at)
VALUES (@ex_b, @b_demo1, @u_sy, @u_demo, '그럼 내일 오후 3시에 뵐게요! 감사합니다 :)',
        NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 2 DAY);
SET @room_b = LAST_INSERT_ID();

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_b, @u_sy, '안녕하세요! 불편한 편의점 교환 신청했어요 :)', 'TEXT', NOW() - INTERVAL 2 DAY);

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_b, @u_demo, '안녕하세요! 미드나잇 라이브러리 저도 읽고 싶었어요. 좋아요!', 'TEXT', NOW() - INTERVAL 2 DAY + INTERVAL 5 MINUTE);

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_b, @u_sy, '혹시 언제 시간 괜찮으세요? 역삼역 근처면 좋을 것 같아요.', 'TEXT', NOW() - INTERVAL 1 DAY);

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_b, @u_demo, '내일 오후 3시 어떠세요? 역삼역 3번 출구에서 봬요.', 'TEXT', NOW() - INTERVAL 2 HOUR);

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_b, @u_sy, '그럼 내일 오후 3시에 뵐게요! 감사합니다 :)', 'TEXT', NOW() - INTERVAL 1 HOUR);
SET @msg_last = LAST_INSERT_ID();

INSERT INTO chat_room_participants (room_id, user_id, last_read_message_id, last_read_at) VALUES
    (@room_b, @u_demo, @msg_last - 1, NOW() - INTERVAL 90 MINUTE),
    (@room_b, @u_sy,   @msg_last,     NOW() - INTERVAL 1 HOUR);

-- ── 리뷰 (완료된 교환 A 상호 평가) ───────────────────────────────────────────
INSERT INTO reviews (exchange_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
    (@ex_a, @u_demo, @u_sy,   5, '책 상태도 좋고 시간 약속도 잘 지키셨어요. 또 교환하고 싶어요!', NOW() - INTERVAL 6 DAY),
    (@ex_a, @u_sy,   @u_demo, 5, '친절하고 책도 깨끗했습니다. 강력 추천해요 :)',               NOW() - INTERVAL 6 DAY);

-- ── 알림 (데모 계정 민준 기준) ───────────────────────────────────────────────
INSERT INTO notifications (user_id, type, content, is_read, reference_id, reference_type, created_at) VALUES
    (@u_demo, 'EXCHANGE_REQUEST',   '서연님이 회원님의 ''불편한 편의점'' 교환을 신청했어요.', FALSE, @ex_b,   'EXCHANGE', NOW() - INTERVAL 2 DAY),
    (@u_demo, 'CHAT_MESSAGE',       '서연님이 새 메시지를 보냈어요.',                        FALSE, @room_b, 'CHAT',     NOW() - INTERVAL 1 HOUR),
    (@u_demo, 'EXCHANGE_COMPLETED', '''어린 왕자'' 교환이 완료되었어요.',                     TRUE,  @ex_a,   'EXCHANGE', NOW() - INTERVAL 7 DAY),
    (@u_demo, 'REVIEW_REQUESTED',   '서연님과의 교환은 어떠셨나요? 후기를 남겨보세요.',        TRUE,  @ex_a,   'EXCHANGE', NOW() - INTERVAL 7 DAY);
