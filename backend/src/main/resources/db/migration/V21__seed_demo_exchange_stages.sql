-- ─────────────────────────────────────────────────────────────────────────────
-- App Store 심사용: 대여 흐름의 중간 단계를 모두 볼 수 있도록 상태별 거래를 채운다.
--
-- V16 에는 PENDING / ACCEPTED / COMPLETED 세 상태만 있어서 약속·일정·1차 교환·
-- 반납 대기 화면을 확인할 수 없었다. 심사관이 계정을 전환하지 않아도 로그인만으로
-- 전 단계를 볼 수 있도록, 데모 계정 두 명(민준·서연) 사이에 네 건을 추가한다.
--
--   D. PLEDGED          약속문 동의 완료, 일정 미정
--   E. SCHEDULED        일정 확정, 1차 교환 대기
--   F. FIRST_EXCHANGED  책 전달 완료, 반납 대기 (D-3 알림 시연용)
--   G. SECOND_EXCHANGED 반납 완료, 후기 작성 대기 (심사관이 직접 후기 작성 가능)
-- ─────────────────────────────────────────────────────────────────────────────

SET @u_demo = (SELECT id FROM users WHERE oauth_provider = 'GOOGLE' AND oauth_id = 'demo-reviewer-apple');
SET @u_sy   = (SELECT id FROM users WHERE oauth_provider = 'KAKAO'  AND oauth_id = 'demo-seed-seoyeon');

-- ── 거래에 묶을 도서 (양쪽 4권씩) ────────────────────────────────────────────
INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '달러구트 꿈 백화점', '이미예', '팩토리나인', 'novel',
        '잠들어야만 입장할 수 있는 꿈 백화점 이야기. 표지 깨끗합니다.', 'plum', 'IN_PROGRESS', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 16 DAY, NOW());
SET @b_demo_d = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '여행의 이유', '김영하', '문학동네', 'essay',
        '읽고 나면 어딘가로 떠나고 싶어지는 산문집이에요.', 'sage', 'IN_PROGRESS', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 15 DAY, NOW());
SET @b_demo_e = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '모순', '양귀자', '쓰다', 'novel',
        '오래된 소설이지만 여전히 좋아요. 밑줄 없이 깨끗합니다.', 'ink', 'IN_PROGRESS', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 14 DAY, NOW());
SET @b_demo_f = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_demo, '나는 나로 살기로 했다', '김수현', '마음의숲', 'selfdev',
        '마음이 지칠 때 꺼내 읽는 책이에요.', 'orange', 'IN_PROGRESS', '서울 강남구 · 역삼동',
        NOW() - INTERVAL 13 DAY, NOW());
SET @b_demo_g = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '아주 희미한 빛으로도', '최은영', '문학동네', 'novel',
        '조용하지만 오래 남는 소설집입니다.', 'sand', 'IN_PROGRESS', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 16 DAY, NOW());
SET @b_sy_d = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '보통의 존재', '이석원', '달', 'essay',
        '담담한 문장이 좋아서 몇 번씩 다시 읽었어요.', 'blue', 'IN_PROGRESS', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 15 DAY, NOW());
SET @b_sy_e = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '쇼코의 미소', '최은영', '문학동네', 'novel',
        '첫 소설집이에요. 상태 좋습니다.', 'plum', 'IN_PROGRESS', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 14 DAY, NOW());
SET @b_sy_f = LAST_INSERT_ID();

INSERT INTO books (user_id, title, author, publisher, genre, description, cover_color, status, neighborhood, created_at, updated_at)
VALUES (@u_sy, '언어의 온도', '이기주', '말글터', 'essay',
        '문장 하나하나가 따뜻한 책입니다.', 'sage', 'IN_PROGRESS', '서울 강남구 · 삼성동',
        NOW() - INTERVAL 13 DAY, NOW());
SET @b_sy_g = LAST_INSERT_ID();

-- ── D. PLEDGED: 민준(요청) ↔ 서연(응답). 양측 약속 동의 완료, 일정 미정 ──────
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       requester_pledged, respondent_pledged, created_at, updated_at)
VALUES (@u_demo, @u_sy, @b_sy_d, @b_demo_d, 'PLEDGED',
        '아주 희미한 빛으로도 빌리고 싶어요. 달러구트 꿈 백화점 드릴게요!',
        TRUE, TRUE, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 3 HOUR);
SET @ex_d = LAST_INSERT_ID();

INSERT INTO chat_rooms (exchange_id, book_id, requester_id, owner_id, last_message, last_message_at, created_at)
VALUES (@ex_d, @b_sy_d, @u_demo, @u_sy, '약속문 동의했어요! 일정만 정하면 될 것 같아요.',
        NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 5 DAY);
SET @room_d = LAST_INSERT_ID();

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_d, @u_demo, '안녕하세요! 아주 희미한 빛으로도 빌릴 수 있을까요?', 'TEXT', NOW() - INTERVAL 5 DAY);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_d, @u_sy, '네 좋아요! 달러구트 꿈 백화점 저도 궁금했어요 :)', 'TEXT', NOW() - INTERVAL 5 DAY + INTERVAL 10 MINUTE);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_d, @u_demo, '약속문 동의했어요! 일정만 정하면 될 것 같아요.', 'TEXT', NOW() - INTERVAL 3 HOUR);
SET @msg_d = LAST_INSERT_ID();

INSERT INTO chat_room_participants (room_id, user_id, last_read_message_id, last_read_at) VALUES
    (@room_d, @u_demo, @msg_d, NOW() - INTERVAL 3 HOUR),
    (@room_d, @u_sy,   @msg_d - 1, NOW() - INTERVAL 1 DAY);

-- ── E. SCHEDULED: 서연(요청) ↔ 민준(응답). 일정 확정, 1차 교환 대기 ──────────
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       requester_pledged, respondent_pledged,
                       first_exchange_date, first_exchange_place, created_at, updated_at)
VALUES (@u_sy, @u_demo, @b_demo_e, @b_sy_e, 'SCHEDULED',
        '여행의 이유 빌리고 싶어요! 보통의 존재 드릴게요.',
        TRUE, TRUE,
        CURDATE() + INTERVAL 2 DAY, '역삼역 3번 출구 스타벅스',
        NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 5 HOUR);
SET @ex_e = LAST_INSERT_ID();

INSERT INTO chat_rooms (exchange_id, book_id, requester_id, owner_id, last_message, last_message_at, created_at)
VALUES (@ex_e, @b_demo_e, @u_sy, @u_demo, '모레 오후 3시 역삼역 3번 출구에서 뵐게요!',
        NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 4 DAY);
SET @room_e = LAST_INSERT_ID();

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_e, @u_sy, '여행의 이유 아직 빌릴 수 있을까요?', 'TEXT', NOW() - INTERVAL 4 DAY);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_e, @u_demo, '그럼요! 언제 시간 괜찮으세요?', 'TEXT', NOW() - INTERVAL 4 DAY + INTERVAL 20 MINUTE);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_e, @u_sy, '모레 오후 3시 역삼역 3번 출구에서 뵐게요!', 'TEXT', NOW() - INTERVAL 5 HOUR);
SET @msg_e = LAST_INSERT_ID();

INSERT INTO chat_room_participants (room_id, user_id, last_read_message_id, last_read_at) VALUES
    (@room_e, @u_sy,   @msg_e, NOW() - INTERVAL 5 HOUR),
    (@room_e, @u_demo, @msg_e - 1, NOW() - INTERVAL 1 DAY);

-- ── F. FIRST_EXCHANGED: 민준(요청) ↔ 서연(응답). 책 전달 완료, 반납 D-3 ──────
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       requester_pledged, respondent_pledged,
                       first_exchange_date, first_exchange_place,
                       requester_first_confirmed, respondent_first_confirmed,
                       due_date, created_at, updated_at)
VALUES (@u_demo, @u_sy, @b_sy_f, @b_demo_f, 'FIRST_EXCHANGED',
        '쇼코의 미소 빌리고 싶어요! 모순 드릴게요.',
        TRUE, TRUE,
        CURDATE() - INTERVAL 11 DAY, '선릉역 2번 출구 카페',
        TRUE, TRUE,
        CURDATE() + INTERVAL 3 DAY,
        NOW() - INTERVAL 13 DAY, NOW() - INTERVAL 11 DAY);
SET @ex_f = LAST_INSERT_ID();

INSERT INTO chat_rooms (exchange_id, book_id, requester_id, owner_id, last_message, last_message_at, created_at)
VALUES (@ex_f, @b_sy_f, @u_demo, @u_sy, '잘 읽고 있어요! 반납일에 맞춰 돌려드릴게요 :)',
        NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 13 DAY);
SET @room_f = LAST_INSERT_ID();

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_f, @u_sy, '오늘 만나서 반가웠어요! 재밌게 읽으세요 :)', 'TEXT', NOW() - INTERVAL 11 DAY);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_f, @u_demo, '잘 읽고 있어요! 반납일에 맞춰 돌려드릴게요 :)', 'TEXT', NOW() - INTERVAL 2 DAY);
SET @msg_f = LAST_INSERT_ID();

INSERT INTO chat_room_participants (room_id, user_id, last_read_message_id, last_read_at) VALUES
    (@room_f, @u_demo, @msg_f, NOW() - INTERVAL 2 DAY),
    (@room_f, @u_sy,   @msg_f, NOW() - INTERVAL 2 DAY);

-- ── G. SECOND_EXCHANGED: 서연(요청) ↔ 민준(응답). 반납 완료, 후기 대기 ───────
INSERT INTO exchanges (requester_id, respondent_id, requested_book_id, selected_book_id, status, message,
                       requester_pledged, respondent_pledged,
                       first_exchange_date, first_exchange_place,
                       requester_first_confirmed, respondent_first_confirmed,
                       requester_second_confirmed, respondent_second_confirmed,
                       due_date, created_at, updated_at)
VALUES (@u_sy, @u_demo, @b_demo_g, @b_sy_g, 'SECOND_EXCHANGED',
        '나는 나로 살기로 했다 빌리고 싶어요. 언어의 온도 드릴게요!',
        TRUE, TRUE,
        CURDATE() - INTERVAL 20 DAY, '역삼역 3번 출구 스타벅스',
        TRUE, TRUE,
        TRUE, TRUE,
        CURDATE() - INTERVAL 2 DAY,
        NOW() - INTERVAL 22 DAY, NOW() - INTERVAL 1 DAY);
SET @ex_g = LAST_INSERT_ID();

INSERT INTO chat_rooms (exchange_id, book_id, requester_id, owner_id, last_message, last_message_at, created_at)
VALUES (@ex_g, @b_demo_g, @u_sy, @u_demo, '책 잘 받았습니다! 덕분에 좋은 책 읽었어요.',
        NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 22 DAY);
SET @room_g = LAST_INSERT_ID();

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_g, @u_sy, '오늘 반납하러 갈게요! 잘 읽었습니다 :)', 'TEXT', NOW() - INTERVAL 2 DAY);
INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
VALUES (@room_g, @u_demo, '책 잘 받았습니다! 덕분에 좋은 책 읽었어요.', 'TEXT', NOW() - INTERVAL 1 DAY);
SET @msg_g = LAST_INSERT_ID();

INSERT INTO chat_room_participants (room_id, user_id, last_read_message_id, last_read_at) VALUES
    (@room_g, @u_sy,   @msg_g, NOW() - INTERVAL 1 DAY),
    (@room_g, @u_demo, @msg_g, NOW() - INTERVAL 1 DAY);

-- ── 알림 (반납 임박 / 후기 요청) ─────────────────────────────────────────────
INSERT INTO notifications (user_id, type, content, is_read, reference_id, reference_type, created_at) VALUES
    (@u_demo, 'SECOND_DUE',       '''쇼코의 미소'' 반납일이 3일 남았어요.',              FALSE, @ex_f, 'EXCHANGE', NOW() - INTERVAL 6 HOUR),
    (@u_demo, 'REVIEW_REQUESTED', '서연님과의 대여는 어떠셨나요? 후기를 남겨보세요.',    FALSE, @ex_g, 'EXCHANGE', NOW() - INTERVAL 1 DAY),
    (@u_sy,   'REVIEW_REQUESTED', '민준님과의 대여는 어떠셨나요? 후기를 남겨보세요.',    FALSE, @ex_g, 'EXCHANGE', NOW() - INTERVAL 1 DAY),
    (@u_sy,   'PLEDGE_REQUESTED', '민준님이 약속문에 동의했어요. 일정을 잡아보세요.',    FALSE, @ex_d, 'EXCHANGE', NOW() - INTERVAL 3 HOUR);
