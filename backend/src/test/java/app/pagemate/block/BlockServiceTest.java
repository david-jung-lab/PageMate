package app.pagemate.block;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("BlockService - 사용자 차단")
class BlockServiceTest {

    @Mock UserBlockRepository userBlockRepository;
    @Mock UserRepository userRepository;

    @InjectMocks BlockService blockService;

    private User user(Long id, String oauthId) {
        User u = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId(oauthId)
                .nickname("사용자" + id)
                .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    @DisplayName("성공 - 차단 관계를 저장한다")
    void block() {
        given(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L, "a")));
        given(userRepository.findById(2L)).willReturn(Optional.of(user(2L, "b")));

        blockService.block(1L, 2L);

        verify(userBlockRepository).save(any(UserBlock.class));
    }

    @Test
    @DisplayName("실패 - 본인은 차단할 수 없다")
    void selfBlock() {
        assertThatThrownBy(() -> blockService.block(1L, 1L))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.SELF_BLOCK);
    }

    @Test
    @DisplayName("이미 차단한 상대는 다시 저장하지 않는다 (멱등)")
    void blockIsIdempotent() {
        given(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).willReturn(true);

        blockService.block(1L, 2L);

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("실패 - 탈퇴한 사용자는 차단할 수 없다")
    void blockDeletedUser() {
        User deleted = user(2L, "b");
        deleted.softDelete();
        given(userBlockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).willReturn(false);
        given(userRepository.findById(1L)).willReturn(Optional.of(user(1L, "a")));
        given(userRepository.findById(2L)).willReturn(Optional.of(deleted));

        assertThatThrownBy(() -> blockService.block(1L, 2L))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("비노출 대상은 내가 차단한 사람과 나를 차단한 사람을 모두 포함한다")
    void invisibleUserIdsAreBidirectional() {
        given(userBlockRepository.findBlockedIdsByBlockerId(1L)).willReturn(List.of(2L, 3L));
        given(userBlockRepository.findBlockerIdsByBlockedId(1L)).willReturn(List.of(4L));

        assertThat(blockService.getInvisibleUserIds(1L)).containsExactlyInAnyOrder(2L, 3L, 4L);
    }

    @Test
    @DisplayName("차단 관계면 신규 접촉을 막는다")
    void assertNotBlocked() {
        given(userBlockRepository.existsBetween(1L, 2L)).willReturn(true);

        assertThatThrownBy(() -> blockService.assertNotBlocked(1L, 2L))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.BLOCKED_USER);
    }

    @Test
    @DisplayName("본인끼리는 차단 관계로 보지 않는다")
    void notBlockedWithSelf() {
        assertThatCode(() -> blockService.assertNotBlocked(1L, 1L)).doesNotThrowAnyException();
        assertThat(blockService.isBlockedBetween(1L, 1L)).isFalse();
    }

    @Test
    @DisplayName("비로그인 사용자에게는 비노출 대상이 없다")
    void invisibleUserIdsForAnonymous() {
        assertThat(blockService.getInvisibleUserIds(null)).isEmpty();
    }
}
