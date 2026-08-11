-- WF7/WF8: 약속문 동의 및 일정 확정 필드 추가
ALTER TABLE exchanges
    ADD COLUMN requester_pledged  BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN respondent_pledged BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN first_exchange_date DATE       NULL,
    ADD COLUMN first_exchange_place VARCHAR(200) NULL;
