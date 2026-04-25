package app.pagemate.chat.dto;

import app.pagemate.chat.ChatRoom;
import app.pagemate.user.User;

import java.time.LocalDateTime;

public record ChatRoomSummaryResponse(
        Long id,
        Long bookId,
        String bookTitle,
        String bookCoverColor,
        String bookImageUrl,
        Long partnerId,
        String partnerNickname,
        String partnerProfileImage,
        String lastMessage,
        LocalDateTime lastMessageAt,
        long unreadCount
) {
    public static ChatRoomSummaryResponse of(ChatRoom room, Long myUserId, long unreadCount) {
        User partner = room.getPartner(myUserId);
        return new ChatRoomSummaryResponse(
                room.getId(),
                room.getBook().getId(),
                room.getBook().getTitle(),
                room.getBook().getCoverColor(),
                room.getBook().getImageUrl(),
                partner.getId(),
                partner.getNickname(),
                partner.getProfileImage(),
                room.getLastMessage(),
                room.getLastMessageAt(),
                unreadCount
        );
    }
}
