package app.pagemate.common.service;

import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Cloudinary 기반 이미지 저장소.
 * CLOUDINARY_URL(cloudinary://key:secret@cloud) 미설정 시 비활성 → upload는 null 반환(앱 무해).
 */
@Slf4j
@Service
public class CloudinaryStorage implements ImageStorage {

    private final Cloudinary cloudinary;
    private final boolean enabled;

    public CloudinaryStorage(@Value("${cloudinary.url:}") String cloudinaryUrl) {
        if (StringUtils.hasText(cloudinaryUrl)) {
            this.cloudinary = new Cloudinary(cloudinaryUrl);
            this.enabled = true;
        } else {
            this.cloudinary = null;
            this.enabled = false;
        }
    }

    /** 허용 이미지 MIME 타입 (iOS 는 HEIC/HEIF 로 올라올 수 있다) */
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
            "image/heic", "image/heif"
    );
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    @Override
    public String upload(MultipartFile file, String folder) {
        if (!enabled || file == null || file.isEmpty()) return null;
        validate(file);
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "public_id", UUID.randomUUID().toString(),
                            "resource_type", "image"
                    )
            );
            return (String) result.get("secure_url");
        } catch (Exception e) {
            log.warn("Cloudinary 업로드 실패 (folder={}): {}", folder, e.getMessage());
            return null;
        }
    }

    /**
     * 업로드 전 1차 검증. 클라이언트가 보낸 Content-Type 은 위조할 수 있으므로
     * 최종 판정은 Cloudinary(resource_type=image)가 하지만, 명백히 잘못된 요청은
     * 외부 호출 비용을 쓰기 전에 여기서 끊는다.
     */
    private void validate(MultipartFile file) {
        if (file.getSize() > MAX_BYTES) {
            throw new PagemateException(ErrorCode.IMAGE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new PagemateException(ErrorCode.INVALID_IMAGE_TYPE);
        }
    }

    @Override
    public void delete(String imageUrl) {
        if (!enabled || !StringUtils.hasText(imageUrl)) return;
        String publicId = extractPublicId(imageUrl);
        if (publicId == null) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.warn("Cloudinary 삭제 실패 (url={}): {}", imageUrl, e.getMessage());
        }
    }

    /**
     * secure_url → public_id 추출.
     * 예) https://res.cloudinary.com/<cloud>/image/upload/v1699/profiles/uuid.jpg → profiles/uuid
     */
    private String extractPublicId(String url) {
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx < 0) return null;
        String path = url.substring(uploadIdx + "/upload/".length());
        // 선행 버전 세그먼트(v1234567/) 제거
        if (path.matches("^v\\d+/.*")) {
            path = path.substring(path.indexOf('/') + 1);
        }
        // 확장자 제거
        int dot = path.lastIndexOf('.');
        return dot > 0 ? path.substring(0, dot) : path;
    }
}
