package app.pagemate.common.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 저장소 추상화. 프로필·(향후)채팅 이미지 업로드가 공통으로 사용한다.
 * 구현체가 비활성(자격증명 미설정)이면 upload는 null을 반환한다.
 */
public interface ImageStorage {

    /** 이미지를 업로드하고 공개 URL을 반환. 실패/미설정 시 null. */
    String upload(MultipartFile file, String folder);

    /** 업로드된 이미지를 URL 기준으로 삭제. */
    void delete(String imageUrl);
}
