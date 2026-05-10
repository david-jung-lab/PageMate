CREATE TABLE reviews (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    exchange_id BIGINT       NOT NULL,
    reviewer_id BIGINT       NOT NULL,
    reviewee_id BIGINT       NOT NULL,
    rating      INT          NOT NULL,
    comment     VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_exchange FOREIGN KEY (exchange_id) REFERENCES exchanges (id),
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id),
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users (id),
    CONSTRAINT uq_reviews_exchange_reviewer UNIQUE (exchange_id, reviewer_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
