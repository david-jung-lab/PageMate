package app.pagemate.block;

import app.pagemate.block.dto.BlockedUserResponse;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    @Transactional
    public void block(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new PagemateException(ErrorCode.SELF_BLOCK);
        }
        if (userBlockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            return; // 이미 차단한 상대는 멱등 처리
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        User blocked = userRepository.findById(blockedId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        userBlockRepository.save(UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build());
    }

    @Transactional
    public void unblock(Long blockerId, Long blockedId) {
        userBlockRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .ifPresent(userBlockRepository::delete);
    }

    public List<BlockedUserResponse> getBlockedUsers(Long blockerId) {
        return userBlockRepository.findAllByBlockerId(blockerId).stream()
                .map(BlockedUserResponse::of)
                .toList();
    }

    /** 어느 방향으로든 차단 관계이면 true */
    public boolean isBlockedBetween(Long userId, Long otherId) {
        if (userId == null || otherId == null || userId.equals(otherId)) return false;
        return userBlockRepository.existsBetween(userId, otherId);
    }

    /** 차단 관계여서 서로 보이지 않아야 하는 사용자 ID 집합 (양방향) */
    public Set<Long> getInvisibleUserIds(Long userId) {
        if (userId == null) return Set.of();
        Set<Long> ids = new HashSet<>(userBlockRepository.findBlockedIdsByBlockerId(userId));
        ids.addAll(userBlockRepository.findBlockerIdsByBlockedId(userId));
        return ids;
    }

    /** 차단 관계이면 예외를 던진다. 신규 접촉(거래 요청·채팅 시작)을 막는 데 사용한다. */
    public void assertNotBlocked(Long userId, Long otherId) {
        if (isBlockedBetween(userId, otherId)) {
            throw new PagemateException(ErrorCode.BLOCKED_USER);
        }
    }
}
