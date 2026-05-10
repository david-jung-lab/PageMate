ALTER TABLE books
    DROP COLUMN lat,
    DROP COLUMN lng,
    ADD COLUMN neighborhood VARCHAR(100) NULL;

CREATE INDEX idx_books_neighborhood ON books (neighborhood);
