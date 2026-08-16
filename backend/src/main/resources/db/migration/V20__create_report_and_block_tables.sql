-- UGC 신고·차단 (App Store 심사 지침 1.2 요구사항)

CREATE TABLE reports (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT       NOT NULL,
    target_type VARCHAR(20)  NOT NULL,
    target_id   BIGINT       NOT NULL,
    reason      VARCHAR(20)  NOT NULL,
    detail      VARCHAR(500),
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at  DATETIME(6)  NOT NULL,
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
    -- 같은 대상을 중복 신고하지 못하게 한다
    CONSTRAINT uq_reports_reporter_target UNIQUE (reporter_id, target_type, target_id),
    INDEX idx_reports_status (status),
    INDEX idx_reports_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_blocks (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    blocker_id BIGINT      NOT NULL,
    blocked_id BIGINT      NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_user_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES users (id),
    CONSTRAINT fk_user_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES users (id),
    CONSTRAINT uq_user_blocks UNIQUE (blocker_id, blocked_id),
    INDEX idx_user_blocks_blocker (blocker_id),
    INDEX idx_user_blocks_blocked (blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
