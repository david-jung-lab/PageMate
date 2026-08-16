package app.pagemate.common.service;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("CloudinaryStorage - 업로드 전 검증")
class CloudinaryStorageTest {

    /** 형식만 맞춘 더미 자격증명. 검증 실패 케이스는 네트워크 호출 전에 끊긴다. */
    private final CloudinaryStorage storage =
            new CloudinaryStorage("cloudinary://key:secret@cloud");

    private MockMultipartFile file(String name, String contentType, int bytes) {
        return new MockMultipartFile("image", name, contentType, new byte[bytes]);
    }

    @Test
    @DisplayName("이미지가 아닌 파일은 거부한다")
    void rejectNonImage() {
        assertThatThrownBy(() -> storage.upload(file("a.pdf", "application/pdf", 100), "chat"))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_IMAGE_TYPE);
    }

    @Test
    @DisplayName("Content-Type 이 없으면 거부한다")
    void rejectMissingContentType() {
        assertThatThrownBy(() -> storage.upload(file("a.jpg", null, 100), "chat"))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_IMAGE_TYPE);
    }

    @Test
    @DisplayName("5MB 를 넘으면 거부한다")
    void rejectTooLarge() {
        assertThatThrownBy(() -> storage.upload(file("a.jpg", "image/jpeg", 6 * 1024 * 1024), "chat"))
                .isInstanceOf(PagemateException.class)
                .extracting(e -> ((PagemateException) e).getErrorCode())
                .isEqualTo(ErrorCode.IMAGE_TOO_LARGE);
    }

    @Test
    @DisplayName("빈 파일은 업로드하지 않고 null 을 반환한다")
    void emptyFileReturnsNull() {
        assertThat(storage.upload(file("a.jpg", "image/jpeg", 0), "chat")).isNull();
    }

    @Test
    @DisplayName("CLOUDINARY_URL 미설정이면 검증 없이 비활성 처리한다")
    void disabledReturnsNull() {
        CloudinaryStorage disabled = new CloudinaryStorage("");
        assertThat(disabled.upload(file("a.pdf", "application/pdf", 100), "chat")).isNull();
    }
}
