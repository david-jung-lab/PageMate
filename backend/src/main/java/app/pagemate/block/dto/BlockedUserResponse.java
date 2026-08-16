package app.pagemate.block.dto;

import app.pagemate.block.UserBlock;
import app.pagemate.user.User;

import java.time.LocalDateTime;

public record BlockedUserResponse(
        Long id,
        String nickname,
        String handle,
        String profileImage,
        String avatarColor,
        LocalDateTime blockedAt
) {
    public static BlockedUserResponse of(UserBlock block) {
        User blocked = block.getBlocked();
        return new BlockedUserResponse(
                blocked.getId(),
                blocked.getNickname(),
                blocked.getHandle(),
                blocked.getProfileImage(),
                blocked.getAvatarColor(),
                block.getCreatedAt()
        );
    }
}
