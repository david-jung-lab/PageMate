package app.pagemate.auth;

import app.pagemate.auth.dto.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequiredArgsConstructor
@Profile("local")
public class TestAuthController {

    private final AuthService authService;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${oauth.kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @Value("${oauth.google.redirect-uri}")
    private String googleRedirectUri;

    // ─── Test page ────────────────────────────────────────────────────────────

    @GetMapping(value = "/test", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String testPage() {
        String kakaoUrl = "https://kauth.kakao.com/oauth/authorize"
                + "?client_id=" + kakaoClientId
                + "&redirect_uri=" + encode(kakaoRedirectUri)
                + "&response_type=code";

        String googleUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + googleClientId
                + "&redirect_uri=" + encode(googleRedirectUri)
                + "&response_type=code"
                + "&scope=openid%20profile%20email";

        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>PageMate · 로그인 테스트</title>
                  <style>
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{background:#13162A;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,'Apple SD Gothic Neo','Pretendard',sans-serif;color:#F5F4F0;padding:24px}
                    .card{background:#1E2240;border-radius:20px;padding:40px 36px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
                    .logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;justify-content:center}
                    .logo-dot{width:12px;height:12px;border-radius:50%;background:#4F86C6}
                    .logo-text{font-size:22px;font-weight:700;letter-spacing:-.03em}
                    .subtitle{font-size:12px;color:#6B7280;background:#13162A;padding:3px 10px;border-radius:99px;margin-left:8px;font-weight:500}
                    h2{font-size:15px;font-weight:600;color:#9CA3AF;margin-bottom:20px;letter-spacing:-.01em}
                    .btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:52px;border-radius:12px;border:none;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;letter-spacing:-.02em;transition:opacity .15s}
                    .btn:hover{opacity:.88}
                    .btn-kakao{background:#FEE500;color:#191919;margin-bottom:12px}
                    .btn-google{background:#FFFFFF;color:#191919}
                    .btn svg{flex-shrink:0}
                    .divider{text-align:center;margin:24px 0 16px;font-size:12px;color:#6B7280}
                    .link{color:#4F86C6;text-decoration:none;font-size:13px;font-weight:500}
                    .link:hover{text-decoration:underline}
                    .hint{font-size:11px;color:#6B7280;margin-top:20px;text-align:center;line-height:1.6}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="logo">
                      <div class="logo-dot"></div>
                      <span class="logo-text">PageMate</span>
                      <span class="subtitle">dev</span>
                    </div>
                    <h2>소셜 로그인 테스트</h2>
                    <a href="%s" class="btn btn-kakao">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3C6.477 3 2 6.804 2 11.5c0 2.972 1.722 5.586 4.328 7.18L5.25 22.5l4.594-2.954C10.535 19.839 11.258 20 12 20c5.523 0 10-3.804 10-8.5S17.523 3 12 3z" fill="#191919"/></svg>
                      카카오로 로그인
                    </a>
                    <a href="%s" class="btn btn-google">
                      <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      구글로 로그인
                    </a>
                    <div class="divider">또는</div>
                    <div style="text-align:center">
                      <a href="/swagger-ui.html" class="link">Swagger UI →</a>
                    </div>
                    <p class="hint">⚠️ 이 페이지는 로컬 개발 전용입니다<br>로그인 후 발급된 토큰을 복사해 Swagger 인증에 사용하세요</p>
                  </div>
                </body>
                </html>
                """.formatted(kakaoUrl, googleUrl);
    }

    // ─── Kakao callback ───────────────────────────────────────────────────────

    @GetMapping(value = "/login/oauth2/code/kakao", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String kakaoCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error
    ) {
        if (error != null || code == null) {
            return renderError("카카오 로그인이 취소되었습니다.", error);
        }
        try {
            AuthResponse res = authService.loginWithKakao(code);
            return renderSuccess("카카오", "#FEE500", res);
        } catch (Exception e) {
            return renderError("카카오 로그인 실패", e.getMessage());
        }
    }

    // ─── Google callback ──────────────────────────────────────────────────────

    @GetMapping(value = "/login/oauth2/code/google", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String googleCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String error
    ) {
        if (error != null || code == null) {
            return renderError("구글 로그인이 취소되었습니다.", error);
        }
        try {
            AuthResponse res = authService.loginWithGoogle(code);
            return renderSuccess("구글", "#4285F4", res);
        } catch (Exception e) {
            return renderError("구글 로그인 실패", e.getMessage());
        }
    }

    // ─── HTML templates ───────────────────────────────────────────────────────

    private String renderSuccess(String provider, String providerColor, AuthResponse res) {
        AuthResponse.UserSummary user = res.getUser();
        String newUserBadge = user.isNewUser()
                ? "<span class='badge badge-new'>신규 가입</span>"
                : "<span class='badge badge-exist'>기존 유저</span>";

        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>PageMate · 로그인 성공</title>
                  <style>
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{background:#13162A;min-height:100vh;font-family:-apple-system,'Apple SD Gothic Neo','Pretendard',sans-serif;color:#F5F4F0;padding:32px 24px}
                    .wrap{max-width:560px;margin:0 auto}
                    .header{display:flex;align-items:center;gap:12px;margin-bottom:28px}
                    .header .provider-dot{width:10px;height:10px;border-radius:50%;background:%s}
                    h1{font-size:20px;font-weight:700;letter-spacing:-.03em}
                    .user-card{background:#1E2240;border-radius:16px;padding:20px 24px;margin-bottom:16px;display:flex;align-items:center;gap:16px}
                    .avatar{width:48px;height:48px;border-radius:50%;background:#4F86C6;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0}
                    .user-info{flex:1}
                    .user-name{font-size:16px;font-weight:700;letter-spacing:-.02em}
                    .user-handle{font-size:13px;color:#9CA3AF;margin-top:2px}
                    .badge{font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px}
                    .badge-new{background:#1a3a1a;color:#4ade80}
                    .badge-exist{background:#1a1a3a;color:#93c5fd}
                    .section{margin-bottom:16px}
                    .section-title{font-size:11px;font-weight:600;color:#6B7280;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
                    .token-box{background:#1E2240;border-radius:12px;overflow:hidden}
                    .token-row{padding:14px 16px;border-bottom:1px solid #2a2f4a;display:flex;align-items:flex-start;gap:12px}
                    .token-row:last-child{border-bottom:none}
                    .token-label{font-size:11px;font-weight:600;color:#6B7280;width:100px;flex-shrink:0;padding-top:2px}
                    .token-val{font-size:12px;font-family:'SF Mono','Fira Code',monospace;color:#93c5fd;word-break:break-all;flex:1;line-height:1.5}
                    .copy-btn{flex-shrink:0;padding:4px 10px;background:#4F86C6;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap}
                    .copy-btn:hover{background:#3a6fa5}
                    .copy-btn.copied{background:#16a34a}
                    .actions{display:flex;gap:10px;margin-top:20px}
                    .btn{height:44px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;flex:1;letter-spacing:-.01em}
                    .btn-back{background:#2a2f4a;color:#F5F4F0}
                    .btn-swagger{background:#4F86C6;color:#fff}
                    .btn:hover{opacity:.85}
                    .expires{font-size:11px;color:#6B7280;margin-top:6px;text-align:right}
                  </style>
                </head>
                <body>
                  <div class="wrap">
                    <div class="header">
                      <div class="provider-dot"></div>
                      <h1>%s 로그인 성공 ✓</h1>
                    </div>

                    <div class="user-card">
                      <div class="avatar">%s</div>
                      <div class="user-info">
                        <div class="user-name">%s</div>
                        <div class="user-handle">@%s &nbsp;·&nbsp; ID: %s</div>
                      </div>
                      %s
                    </div>

                    <div class="section">
                      <div class="section-title">토큰</div>
                      <div class="token-box">
                        <div class="token-row">
                          <span class="token-label">Access Token</span>
                          <span class="token-val" id="at">%s</span>
                          <button class="copy-btn" onclick="copy('at',this)">복사</button>
                        </div>
                        <div class="token-row">
                          <span class="token-label">Refresh Token</span>
                          <span class="token-val" id="rt">%s</span>
                          <button class="copy-btn" onclick="copy('rt',this)">복사</button>
                        </div>
                      </div>
                      <p class="expires">Access Token 만료: %d초 후</p>
                    </div>

                    <div class="actions">
                      <a href="/test" class="btn btn-back">← 돌아가기</a>
                      <a href="/swagger-ui.html" class="btn btn-swagger">Swagger UI →</a>
                    </div>
                  </div>

                  <script>
                    function copy(id, btn) {
                      navigator.clipboard.writeText(document.getElementById(id).textContent);
                      btn.textContent = '복사됨 ✓';
                      btn.classList.add('copied');
                      setTimeout(() => { btn.textContent = '복사'; btn.classList.remove('copied'); }, 2000);
                    }
                  </script>
                </body>
                </html>
                """.formatted(
                providerColor,
                provider,
                user.getNickname() != null ? user.getNickname().substring(0, 1) : "?",
                user.getNickname() != null ? user.getNickname() : "(닉네임 없음)",
                user.getHandle() != null ? user.getHandle() : "-",
                user.getId(),
                newUserBadge,
                res.getAccessToken(),
                res.getRefreshToken(),
                res.getAccessTokenExpiresIn()
        );
    }

    private String renderError(String title, String detail) {
        String detailHtml = (detail != null)
                ? "<p class='detail'>" + escapeHtml(detail) + "</p>"
                : "";
        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <title>PageMate · 로그인 실패</title>
                  <style>
                    *{box-sizing:border-box;margin:0;padding:0}
                    body{background:#13162A;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,'Apple SD Gothic Neo','Pretendard',sans-serif;color:#F5F4F0;padding:24px}
                    .card{background:#1E2240;border-radius:20px;padding:40px 36px;max-width:400px;width:100%;text-align:center}
                    .icon{font-size:40px;margin-bottom:16px}
                    h1{font-size:18px;font-weight:700;margin-bottom:8px;letter-spacing:-.02em}
                    .detail{font-size:13px;color:#9CA3AF;margin-bottom:24px;line-height:1.6;word-break:break-all}
                    a{display:inline-flex;align-items:center;justify-content:center;height:44px;padding:0 24px;background:#4F86C6;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-.01em}
                    a:hover{opacity:.85}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="icon">⚠️</div>
                    <h1>%s</h1>
                    %s
                    <a href="/test">← 다시 시도</a>
                  </div>
                </body>
                </html>
                """.formatted(escapeHtml(title), detailHtml);
    }

    private String encode(String s) {
        try { return java.net.URLEncoder.encode(s, "UTF-8"); }
        catch (Exception e) { return s; }
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
