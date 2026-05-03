-- 방1 (민준 ↔ 구글테스터, 파친코) 테스트 메시지
INSERT INTO messages (room_id, sender_id, content, message_type, created_at) VALUES
(1, 1, '안녕하세요! 파친코 교환 가능한가요?',      'TEXT', NOW() - INTERVAL 10 MINUTE),
(1, 2, '네, 가능해요! 어떤 책이랑 교환하실 건가요?', 'TEXT', NOW() - INTERVAL 9 MINUTE),
(1, 1, '채식주의자랑 교환하고 싶어요',              'TEXT', NOW() - INTERVAL 8 MINUTE),
(1, 2, '좋아요, 위치가 어떻게 되세요?',             'TEXT', NOW() - INTERVAL 7 MINUTE),
(1, 1, '강남역 근처예요',                           'TEXT', NOW() - INTERVAL 6 MINUTE),
(1, 2, '저도 강남이에요! 내일 만날 수 있어요?',     'TEXT', NOW() - INTERVAL 5 MINUTE),
(1, 1, '네, 내일 오후 2시 어때요?',                 'TEXT', NOW() - INTERVAL 4 MINUTE),
(1, 2, '좋아요, 강남역 2번 출구에서 봐요!',         'TEXT', NOW() - INTERVAL 3 MINUTE);
