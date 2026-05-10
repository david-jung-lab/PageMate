ALTER TABLE exchanges
    DROP FOREIGN KEY fk_exchanges_offered_book,
    DROP COLUMN offered_book_id,
    ADD COLUMN selected_book_id BIGINT NULL,
    ADD CONSTRAINT fk_exchanges_selected_book FOREIGN KEY (selected_book_id) REFERENCES books (id);
