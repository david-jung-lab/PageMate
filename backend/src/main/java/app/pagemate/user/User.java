package app.pagemate.user;

import app.pagemate.auth.OAuthProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"oauth_provider", "oauth_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "oauth_provider", nullable = false, length = 10)
    private OAuthProvider oauthProvider;

    @Column(name = "oauth_id", nullable = false, length = 100)
    private String oauthId;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String nickname;

    @Column(unique = true, length = 30)
    private String handle;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(length = 200)
    private String bio;

    @Column(name = "avatar_color", length = 20)
    private String avatarColor;

    @Column(length = 100)
    private String location;

    @Column(precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(precision = 10, scale = 7)
    private BigDecimal lng;

    @Column(name = "is_onboarded", nullable = false)
    @Builder.Default
    private boolean isOnboarded = false;

    @Column(name = "fcm_token")
    private String fcmToken;

    @Column(name = "refresh_token")
    private String refreshToken;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_tags", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "tag", length = 50)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void completeOnboarding() {
        this.isOnboarded = true;
    }

    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public void updateRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public void clearRefreshToken() {
        this.refreshToken = null;
    }

    public void updateProfile(String nickname, String bio, String location,
                              String avatarColor, List<String> tags, String profileImage) {
        if (nickname != null) this.nickname = nickname;
        if (bio != null) this.bio = bio;
        if (location != null) this.location = location;
        if (avatarColor != null) this.avatarColor = avatarColor;
        if (tags != null) { this.tags.clear(); this.tags.addAll(tags); }
        if (profileImage != null) this.profileImage = profileImage;
    }

    public void updateHandle(String handle) {
        this.handle = handle;
    }

    public void updateEmail(String email) {
        this.email = email;
    }

    public void updateLocation(BigDecimal lat, BigDecimal lng) {
        this.lat = lat;
        this.lng = lng;
    }
}
