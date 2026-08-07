-- 계정 삭제(탈퇴) 지원: 거래·채팅 이력의 참조 무결성을 유지하기 위해
-- 행을 지우는 대신 개인정보를 익명화하고 deleted_at 을 기록한다.
ALTER TABLE users ADD COLUMN deleted_at DATETIME(6) NULL;

CREATE INDEX idx_users_deleted_at ON users (deleted_at);
