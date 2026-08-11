-- ─────────────────────────────────────────────────────────────────────────────
-- 데모 데이터에 실제 이미지 부여 (Cloudinary 업로드본)
--   · 데모 유저 4명 프로필 이미지
--   · 데모 채팅방(서연↔민준)에 이미지 메시지 2개 (MessageType.IMAGE)
-- URL은 버전 세그먼트 없이 사용(재업로드에도 안정적으로 유효).
-- ─────────────────────────────────────────────────────────────────────────────

-- 프로필 이미지
UPDATE users SET profile_image = 'https://res.cloudinary.com/dscfgobgr/image/upload/profiles/seed_minjun.jpg'
WHERE oauth_provider = 'GOOGLE' AND oauth_id = 'demo-reviewer-apple';
UPDATE users SET profile_image = 'https://res.cloudinary.com/dscfgobgr/image/upload/profiles/seed_seoyeon.jpg'
WHERE oauth_provider = 'KAKAO' AND oauth_id = 'demo-seed-seoyeon';
UPDATE users SET profile_image = 'https://res.cloudinary.com/dscfgobgr/image/upload/profiles/seed_dohyun.jpg'
WHERE oauth_provider = 'GOOGLE' AND oauth_id = 'demo-seed-dohyun';
UPDATE users SET profile_image = 'https://res.cloudinary.com/dscfgobgr/image/upload/profiles/seed_haneul.jpg'
WHERE oauth_provider = 'KAKAO' AND oauth_id = 'demo-seed-haneul';

-- 채팅 이미지 메시지 (데모 방: owner=민준, requester=서연)
SET @u_demo = (SELECT id FROM users WHERE oauth_provider = 'GOOGLE' AND oauth_id = 'demo-reviewer-apple');
SET @u_sy   = (SELECT id FROM users WHERE oauth_provider = 'KAKAO'  AND oauth_id = 'demo-seed-seoyeon');
SET @room   = (SELECT id FROM chat_rooms WHERE owner_id = @u_demo AND requester_id = @u_sy ORDER BY id DESC LIMIT 1);

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
SELECT @room, @u_sy, 'https://res.cloudinary.com/dscfgobgr/image/upload/chat/seed_chat_1.jpg', 'IMAGE', NOW() - INTERVAL 40 MINUTE
FROM DUAL WHERE @room IS NOT NULL AND @u_sy IS NOT NULL;

INSERT INTO messages (room_id, sender_id, content, message_type, created_at)
SELECT @room, @u_demo, 'https://res.cloudinary.com/dscfgobgr/image/upload/chat/seed_chat_2.jpg', 'IMAGE', NOW() - INTERVAL 35 MINUTE
FROM DUAL WHERE @room IS NOT NULL AND @u_demo IS NOT NULL;

-- 방 목록의 마지막 메시지를 사진으로 갱신
UPDATE chat_rooms SET last_message = '[사진]', last_message_at = NOW() - INTERVAL 35 MINUTE
WHERE id = @room;
