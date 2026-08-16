package app.pagemate.auth;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * App Store 심사관용 체험 계정.
 * PageMate 는 1:1 대여 서비스라 한쪽 계정만으로는 요청→수락→교환→반납 흐름을 끝까지 볼 수 없다.
 * 그래서 거래 양쪽 계정을 모두 제공해 심사관이 계정을 전환하며 실제 플로우를 완주할 수 있게 한다.
 * 식별자는 V16 시드 마이그레이션과 일치해야 한다.
 */
@Getter
@RequiredArgsConstructor
public enum DemoAccount {

    BORROWER(OAuthProvider.GOOGLE, "demo-reviewer-apple", "민준",
            "빌리는 사람", "이웃에게 책을 빌려달라고 요청하는 쪽입니다."),

    LENDER(OAuthProvider.KAKAO, "demo-seed-seoyeon", "서연",
            "빌려주는 사람", "요청을 받아 수락하고 책을 빌려주는 쪽입니다.");

    private final OAuthProvider provider;
    private final String oauthId;
    private final String nickname;
    private final String role;
    private final String description;
}
