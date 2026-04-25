package app.pagemate.user.dto;

import app.pagemate.user.User;

import java.time.LocalDateTime;
import java.util.List;

public record ProfileResponse(
        Long id,
        String nickname,
        String handle,
        String profileImage,
        String bio,
        String avatarColor,
        String location,
        List<String> tags,
        int bookCount,
        LocalDateTime createdAt
) {
    public static ProfileResponse of(User user, int bookCount) {
        return new ProfileResponse(
                user.getId(),
                user.getNickname(),
                user.getHandle(),
                user.getProfileImage(),
                user.getBio(),
                user.getAvatarColor(),
                user.getLocation(),
                user.getTags(),
                bookCount,
                user.getCreatedAt()
        );
    }
}
