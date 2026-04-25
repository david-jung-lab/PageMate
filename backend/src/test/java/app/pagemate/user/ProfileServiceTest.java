package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import app.pagemate.book.BookQueryRepository;
import app.pagemate.book.BookRepository;
import app.pagemate.book.BookStatus;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.service.S3Service;
import app.pagemate.user.dto.ProfileResponse;
import app.pagemate.user.dto.ProfileUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock UserRepository userRepository;
    @Mock BookRepository bookRepository;
    @Mock BookQueryRepository bookQueryRepository;
    @Mock S3Service s3Service;

    @InjectMocks ProfileService profileService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .oauthProvider(OAuthProvider.KAKAO)
                .oauthId("kakao_001")
                .nickname("김독서")
                .handle("user_kimbook")
                .bio("책을 좋아해요")
                .avatarColor("blue")
                .location("망원동")
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
    }

    // ─── getMyProfile ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getMyProfile")
    class GetMyProfile {

        @Test
        @DisplayName("성공 - 프로필과 등록 도서 수를 함께 반환한다")
        void success() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(3);

            ProfileResponse res = profileService.getMyProfile(1L);

            assertThat(res.id()).isEqualTo(1L);
            assertThat(res.nickname()).isEqualTo("김독서");
            assertThat(res.bookCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getMyProfile(99L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    // ─── updateMyProfile ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateMyProfile")
    class UpdateMyProfile {

        @Test
        @DisplayName("성공 - 이미지 포함 전체 필드 수정")
        void withImage() {
            ReflectionTestUtils.setField(user, "profileImage", "https://s3.example.com/old.jpg");
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(0);
            given(s3Service.upload(any(), eq("profiles")))
                    .willReturn("https://s3.example.com/new.jpg");

            ProfileUpdateRequest req = new ProfileUpdateRequest();
            req.setNickname("새닉네임");
            req.setBio("새 소개");
            req.setLocation("연남동");
            req.setAvatarColor("orange");
            req.setTags(List.of("소설", "SF"));
            req.setImage(new MockMultipartFile("image", "new.jpg",
                    MediaType.IMAGE_JPEG_VALUE, "bytes".getBytes()));

            ProfileResponse res = profileService.updateMyProfile(1L, req);

            verify(s3Service).delete("https://s3.example.com/old.jpg");
            verify(s3Service).upload(any(), eq("profiles"));
            assertThat(res.nickname()).isEqualTo("새닉네임");
            assertThat(res.bio()).isEqualTo("새 소개");
            assertThat(res.location()).isEqualTo("연남동");
            assertThat(res.avatarColor()).isEqualTo("orange");
            assertThat(res.profileImage()).isEqualTo("https://s3.example.com/new.jpg");
        }

        @Test
        @DisplayName("성공 - 이미지 없이 텍스트 필드만 수정")
        void withoutImage() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(0);

            ProfileUpdateRequest req = new ProfileUpdateRequest();
            req.setNickname("수정닉네임");
            req.setBio("수정 소개");

            ProfileResponse res = profileService.updateMyProfile(1L, req);

            verifyNoInteractions(s3Service);
            assertThat(res.nickname()).isEqualTo("수정닉네임");
            assertThat(res.bio()).isEqualTo("수정 소개");
        }

        @Test
        @DisplayName("성공 - 닉네임만 수정 시 나머지 필드 유지")
        void partialUpdate_nicknameOnly() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(0);

            ProfileUpdateRequest req = new ProfileUpdateRequest();
            req.setNickname("변경된닉네임");
            // bio, location 등은 null → 변경 없음

            ProfileResponse res = profileService.updateMyProfile(1L, req);

            assertThat(res.nickname()).isEqualTo("변경된닉네임");
            assertThat(res.bio()).isEqualTo("책을 좋아해요");   // 기존 값 유지
            assertThat(res.location()).isEqualTo("망원동");      // 기존 값 유지
        }

        @Test
        @DisplayName("성공 - 기존 이미지 없이 신규 이미지 업로드")
        void uploadImageWhenNoPreviousImage() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(0);
            given(s3Service.upload(any(), eq("profiles")))
                    .willReturn("https://s3.example.com/first.jpg");

            ProfileUpdateRequest req = new ProfileUpdateRequest();
            req.setImage(new MockMultipartFile("image", "first.jpg",
                    MediaType.IMAGE_JPEG_VALUE, "bytes".getBytes()));

            profileService.updateMyProfile(1L, req);

            // 기존 이미지 없으므로 delete 호출 없음
            verify(s3Service, never()).delete(any());
            verify(s3Service).upload(any(), eq("profiles"));
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.updateMyProfile(99L, new ProfileUpdateRequest()))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    // ─── getUserProfile ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserProfile")
    class GetUserProfile {

        @Test
        @DisplayName("성공 - 타인 프로필 조회")
        void success() {
            given(userRepository.findById(1L)).willReturn(Optional.of(user));
            given(bookRepository.countByOwnerId(1L)).willReturn(5);

            ProfileResponse res = profileService.getUserProfile(1L);

            assertThat(res.nickname()).isEqualTo("김독서");
            assertThat(res.bookCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void notFound() {
            given(userRepository.findById(99L)).willReturn(Optional.empty());

            assertThatThrownBy(() -> profileService.getUserProfile(99L))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    // ─── getUserBooks ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getUserBooks")
    class GetUserBooks {

        @Test
        @DisplayName("성공 - 등록 도서 목록 반환 (빈 페이지)")
        void success() {
            given(userRepository.existsById(1L)).willReturn(true);
            given(bookQueryRepository.findMyBooks(eq(1L), eq(BookStatus.AVAILABLE), any()))
                    .willReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 20), 0));

            var result = profileService.getUserBooks(1L, 0, 20);

            assertThat(result.content()).isEmpty();
            assertThat(result.totalElements()).isZero();
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 유저 → USER_NOT_FOUND")
        void userNotFound() {
            given(userRepository.existsById(99L)).willReturn(false);

            assertThatThrownBy(() -> profileService.getUserBooks(99L, 0, 20))
                    .isInstanceOf(PagemateException.class)
                    .extracting(e -> ((PagemateException) e).getErrorCode())
                    .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }
}
