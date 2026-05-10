-- Clear all seed/dummy data while preserving schema
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE reviews;
TRUNCATE TABLE messages;
TRUNCATE TABLE chat_room_participants;
TRUNCATE TABLE chat_rooms;
TRUNCATE TABLE notifications;
TRUNCATE TABLE exchanges;
TRUNCATE TABLE books;
TRUNCATE TABLE user_tags;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
