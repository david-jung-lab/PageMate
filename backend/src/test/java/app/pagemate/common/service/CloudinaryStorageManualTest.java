package app.pagemate.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 Cloudinary 연동 확인용 수동 테스트. CLOUDINARY_URL 환경변수가 있을 때만 실행된다.
 * 시드용 이미지(아바타·사진)도 원격 URL로 업로드해 secure_url 을 콘솔에 출력한다.
 */
@EnabledIfEnvironmentVariable(named = "CLOUDINARY_URL", matches = ".+")
class CloudinaryStorageManualTest {

    // 1x1 PNG (앱 업로드 경로 검증용)
    private static final byte[] PNG_1x1 = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    @Test
    void uploadsThroughAppCodePath() {
        CloudinaryStorage storage = new CloudinaryStorage(System.getenv("CLOUDINARY_URL"));
        MockMultipartFile file = new MockMultipartFile("file", "probe.png", "image/png", PNG_1x1);
        String url = storage.upload(file, "test");
        System.out.println("[CLOUDINARY][app-path] " + url);
        assertThat(url).isNotNull().contains("res.cloudinary.com");
    }

    @Test
    void uploadsSeedImages() throws Exception {
        Cloudinary cloudinary = new Cloudinary(System.getenv("CLOUDINARY_URL"));

        // 프로필 아바타 (민준/서연/도현/하늘)
        String[] avatars = {
                "https://i.pravatar.cc/400?img=12",
                "https://i.pravatar.cc/400?img=45",
                "https://i.pravatar.cc/400?img=33",
                "https://i.pravatar.cc/400?img=25",
        };
        String[] avatarKeys = { "minjun", "seoyeon", "dohyun", "haneul" };
        for (int i = 0; i < avatars.length; i++) {
            Map<?, ?> r = cloudinary.uploader().upload(avatars[i],
                    ObjectUtils.asMap("folder", "profiles", "public_id", "seed_" + avatarKeys[i]));
            System.out.println("[CLOUDINARY][avatar][" + avatarKeys[i] + "] " + r.get("secure_url"));
        }

        // 채팅에서 주고받는 사진 2장
        String[] chatPhotos = {
                "https://picsum.photos/id/24/800/1000",
                "https://picsum.photos/id/48/800/1000",
        };
        for (int i = 0; i < chatPhotos.length; i++) {
            Map<?, ?> r = cloudinary.uploader().upload(chatPhotos[i],
                    ObjectUtils.asMap("folder", "chat", "public_id", "seed_chat_" + (i + 1)));
            System.out.println("[CLOUDINARY][chat][" + (i + 1) + "] " + r.get("secure_url"));
        }
    }
}
