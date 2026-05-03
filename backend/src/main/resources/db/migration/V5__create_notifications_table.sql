CREATE TABLE IF NOT EXISTS notifications (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    type           VARCHAR(30)  NOT NULL,
    content        VARCHAR(200) NOT NULL,
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    reference_id   BIGINT,
    reference_type VARCHAR(30),
    created_at     DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notifications_user   (user_id),
    INDEX idx_notifications_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
