package app.pagemate.exchange.dto;

import app.pagemate.book.Book;
import app.pagemate.exchange.Exchange;
import app.pagemate.user.User;

import java.time.LocalDateTime;

public record ExchangeResponse(
        Long id,
        BookInfo requestedBook,
        BookInfo offeredBook,
        UserInfo requester,
        UserInfo respondent,
        String status,
        Long chatRoomId,
        LocalDateTime createdAt
) {
    public record BookInfo(
            Long id,
            String title,
            String author,
            String imageUrl,
            String coverColor,
            String status
    ) {
        public static BookInfo of(Book b) {
            return new BookInfo(
                    b.getId(), b.getTitle(), b.getAuthor(),
                    b.getImageUrl(), b.getCoverColor(), b.getStatus().name());
        }
    }

    public record UserInfo(
            Long id,
            String nickname,
            String handle,
            String profileImage,
            String avatarColor
    ) {
        public static UserInfo of(User u) {
            return new UserInfo(
                    u.getId(), u.getNickname(), u.getHandle(),
                    u.getProfileImage(), u.getAvatarColor());
        }
    }

    public static ExchangeResponse of(Exchange e) {
        return new ExchangeResponse(
                e.getId(),
                BookInfo.of(e.getRequestedBook()),
                BookInfo.of(e.getOfferedBook()),
                UserInfo.of(e.getRequester()),
                UserInfo.of(e.getRespondent()),
                e.getStatus().name(),
                null,
                e.getCreatedAt()
        );
    }

    public static ExchangeResponse of(Exchange e, Long chatRoomId) {
        return new ExchangeResponse(
                e.getId(),
                BookInfo.of(e.getRequestedBook()),
                BookInfo.of(e.getOfferedBook()),
                UserInfo.of(e.getRequester()),
                UserInfo.of(e.getRespondent()),
                e.getStatus().name(),
                chatRoomId,
                e.getCreatedAt()
        );
    }
}
