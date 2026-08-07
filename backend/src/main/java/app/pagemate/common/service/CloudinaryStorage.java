package app.pagemate.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
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

    @Override
    public String upload(MultipartFile file, String folder) {
        if (!enabled || file == null || file.isEmpty()) return null;
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
