CREATE TABLE IF NOT EXISTS chat_rooms (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    book_id         BIGINT NOT NULL,
    requester_id    BIGINT NOT NULL,
    owner_id        BIGINT NOT NULL,
    last_message    TEXT,
    last_message_at DATETIME(6),
    created_at      DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rooms_book      FOREIGN KEY (book_id)      REFERENCES books(id)  ON DELETE CASCADE,
    CONSTRAINT fk_rooms_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_rooms_owner     FOREIGN KEY (owner_id)     REFERENCES users(id),
    INDEX idx_rooms_requester (requester_id),
    INDEX idx_rooms_owner     (owner_id),
    INDEX idx_rooms_last_at   (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    room_id      BIGINT NOT NULL,
    sender_id    BIGINT,
    content      TEXT   NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
    is_read      TINYINT(1)  NOT NULL DEFAULT 0,
    created_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_messages_room   FOREIGN KEY (room_id)   REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)      ON DELETE SET NULL,
    INDEX idx_messages_room    (room_id),
    INDEX idx_messages_room_id (room_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
