CREATE TABLE IF NOT EXISTS users (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    oauth_provider VARCHAR(10)  NOT NULL,
    oauth_id       VARCHAR(100) NOT NULL,
    email          VARCHAR(100),
    nickname       VARCHAR(30),
    handle         VARCHAR(30),
    profile_image  TEXT,
    bio            VARCHAR(200),
    avatar_color   VARCHAR(20),
    location       VARCHAR(100),
    lat            DECIMAL(10, 7),
    lng            DECIMAL(10, 7),
    is_onboarded   BOOLEAN      NOT NULL DEFAULT FALSE,
    fcm_token      TEXT,
    refresh_token  TEXT,
    created_at     DATETIME(6),
    updated_at     DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_handle (handle),
    UNIQUE KEY uk_users_oauth  (oauth_provider, oauth_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_tags (
    user_id BIGINT      NOT NULL,
    tag     VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, tag),
    CONSTRAINT fk_user_tags_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
