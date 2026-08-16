package app.pagemate.auth.dto;

import app.pagemate.auth.DemoAccount;

import java.util.List;

/**
 * 체험 로그인 가용 여부와 선택 가능한 계정 목록.
 * 서버에서 데모 로그인을 닫으면 available=false 가 되어 앱에서 버튼이 사라진다.
 */
public record DemoAccountsResponse(
        boolean available,
        List<Account> accounts
) {
    public record Account(
            String key,
            String nickname,
            String role,
            String description
    ) {
        public static Account of(DemoAccount demo) {
            return new Account(demo.name(), demo.getNickname(), demo.getRole(), demo.getDescription());
        }
    }

    public static DemoAccountsResponse unavailable() {
        return new DemoAccountsResponse(false, List.of());
    }

    public static DemoAccountsResponse of(List<DemoAccount> demos) {
        return new DemoAccountsResponse(true, demos.stream().map(Account::of).toList());
    }
}
