-- ───────────────────────────────────────────────
--  Dummy users (OAuth 로그인 없이 테스트용)
-- ───────────────────────────────────────────────
INSERT INTO users (oauth_provider, oauth_id, nickname, handle, bio, avatar_color, created_at, updated_at)
VALUES
  ('KAKAO', 'dummy_001', '책벌레민준', 'minjun_reads', '소설이랑 에세이 좋아해요', 'blue',   NOW(), NOW()),
  ('KAKAO', 'dummy_002', '독서왕서연', 'seoyeon_book', 'SF 덕후입니다 🚀',         'green',  NOW(), NOW()),
  ('GOOGLE','dummy_003', '페이지메이트', 'pagemate_dev', '개발하면서 책 읽어요',       'orange', NOW(), NOW()),
  ('KAKAO', 'dummy_004', '밑줄긋는사람', 'underline_me', '인문 · 역사 전공',          'purple', NOW(), NOW()),
  ('GOOGLE','dummy_005', '주말독서가', 'weekend_reader', '주말마다 카페에서 책 읽어요', 'sage',   NOW(), NOW());

-- ───────────────────────────────────────────────
--  Dummy books
-- ───────────────────────────────────────────────
INSERT INTO books (user_id, title, author, publisher, isbn, genre, description, cover_color, status, lat, lng, created_at, updated_at)
VALUES
  -- 민준 (user 1)
  (1, '채식주의자', '한강', '창비', '9788936433598',
   '소설', '맨부커상 수상작. 읽고 나서 한동안 멍했어요.',
   'sage', 'AVAILABLE', 37.4979, 127.0276, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),

  (1, '아몬드', '손원평', '창비', '9788936434267',
   '소설', '감정을 느끼지 못하는 소년의 이야기. 강추입니다.',
   'blue', 'AVAILABLE', 37.4990, 127.0290, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),

  -- 서연 (user 2)
  (2, '파친코', '이민진', '문학사상', '9788970129259',
   '소설', '재일 조선인 4대 가족의 역사. 묵직한 감동.',
   'orange', 'AVAILABLE', 37.5563, 126.9234, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

  (2, '코스모스', '칼 세이건', '사이언스북스', '9788983711892',
   '과학', '우주에 대한 경외감을 느낄 수 있어요.',
   'blue', 'AVAILABLE', 37.5570, 126.9240, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),

  (2, '클루지', '게리 마커스', '갤리온', '9788901102177',
   '과학', '뇌의 불완전함을 유쾌하게 설명한 책.',
   'sage', 'IN_PROGRESS', 37.5560, 126.9230, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),

  -- pagemate_dev (user 3)
  (3, '린 스타트업', '에릭 리스', '인사이트', '9788966260935',
   '자기계발', '스타트업 필독서. 실무에 적용해봤는데 좋았어요.',
   'green', 'AVAILABLE', 37.5442, 126.9514, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),

  (3, '해커와 화가', '폴 그레이엄', '한빛미디어', '9788979147599',
   '자기계발', '개발자라면 한번쯤 읽어볼 만한 에세이 모음.',
   'orange', 'AVAILABLE', 37.5450, 126.9520, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY),

  -- 밑줄긋는사람 (user 4)
  (4, '총 균 쇠', '재러드 다이아몬드', '문학사상', '9788970128382',
   '역사', '인류 문명 불평등의 원인을 파헤친 명저. 두꺼워요.',
   'purple', 'AVAILABLE', 37.5730, 126.9794, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY),

  (4, '사피엔스', '유발 하라리', '김영사', '9788934972464',
   '인문', '인류의 역사를 빠르게 훑어볼 수 있어요.',
   'blue', 'AVAILABLE', 37.5720, 126.9800, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),

  (4, '논어', '공자', '현암사', '9788932310688',
   '인문', '번역이 좋아요. 밑줄 많이 그었어요.',
   'sage', 'COMPLETED', 37.5735, 126.9780, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 30 DAY),

  -- 주말독서가 (user 5)
  (5, '어린 왕자', '생텍쥐페리', '문학동네', '9788954623748',
   '소설', '어른이 되어 다시 읽었더니 다른 느낌. 선물용으로도 좋아요.',
   'orange', 'AVAILABLE', 37.5133, 127.1000, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),

  (5, '데미안', '헤르만 헤세', '민음사', '9788937460067',
   '소설', '청소년기에 읽으면 더 와닿는 성장 소설.',
   'purple', 'AVAILABLE', 37.5140, 127.1010, NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY),

  (5, '나는 나로 살기로 했다', '김수현', '마음의숲', '9791185479712',
   '에세이', '번아웃 왔을 때 읽었어요. 위로가 됐어요.',
   'green', 'AVAILABLE', 37.5130, 127.0990, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 12 DAY);
