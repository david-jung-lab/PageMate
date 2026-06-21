-- WF9/WF11: 1차/2차 교환 양측 확인(confirmed) 플래그 추가
ALTER TABLE exchanges
    ADD COLUMN requester_first_confirmed   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN respondent_first_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN requester_second_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN respondent_second_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
