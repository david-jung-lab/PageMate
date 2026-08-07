-- 알림(푸시) on/off 설정. 기본값 TRUE(켜짐). 끄면 푸시만 미발송, 인앱 알림함엔 계속 저장.
ALTER TABLE users
    ADD COLUMN push_enabled BOOLEAN NOT NULL DEFAULT TRUE;
