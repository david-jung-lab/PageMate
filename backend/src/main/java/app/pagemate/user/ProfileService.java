package app.pagemate.user;

import app.pagemate.book.BookRepository;
import app.pagemate.book.BookStatus;
import app.pagemate.book.dto.BookPageResponse;
import app.pagemate.book.dto.BookSummaryResponse;
import app.pagemate.block.BlockService;
import app.pagemate.book.BookQueryRepository;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.service.ImageStorage;
import app.pagemate.exchange.Exchange;
import app.pagemate.exchange.ExchangeRepository;
import app.pagemate.exchange.ExchangeStatus;
import app.pagemate.notification.NotificationRepository;
import app.pagemate.review.ReviewRepository;
import app.pagemate.user.dto.OnboardRequest;
import app.pagemate.user.dto.ProfileResponse;
import app.pagemate.user.dto.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    /** 아직 끝나지 않아 탈퇴 시 취소해야 하는 대여 상태 */
    private static final List<ExchangeStatus> ACTIVE_EXCHANGE_STATUSES = List.of(
            ExchangeStatus.PENDING,
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.PLEDGED,
            ExchangeStatus.SCHEDULED,
            ExchangeStatus.FIRST_EXCHANGED,
            ExchangeStatus.SECOND_EXCHANGED
    );

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookQueryRepository bookQueryRepository;
    private final ImageStorage imageStorage;
    private final ReviewRepository reviewRepository;
    private final ExchangeRepository exchangeRepository;
    private final NotificationRepository notificationRepository;
    private final BlockService blockService;

    public ProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        return buildProfileResponse(user, userId);
    }

    @Transactional
    public ProfileResponse updateMyProfile(Long userId, ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        if (req.getHandle() != null && !req.getHandle().equals(user.getHandle())) {
            if (userRepository.existsByHandle(req.getHandle())) {
                throw new PagemateException(ErrorCode.DUPLICATE_HANDLE);
            }
            user.updateHandle(req.getHandle());
        }

        String imageUrl = null;
        if (req.getImage() != null && !req.getImage().isEmpty()) {
            if (user.getProfileImage() != null) {
                imageStorage.delete(user.getProfileImage());
            }
            imageUrl = imageStorage.upload(req.getImage(), "profiles");
        }

        user.updateProfile(
                req.getNickname(),
                req.getBio(),
                req.getLocation(),
                req.getAvatarColor(),
                req.getTags(),
                imageUrl
        );

        return buildProfileResponse(user, userId);
    }

    @Transactional
    public ProfileResponse onboard(Long userId, OnboardRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        if (req.handle() != null && !req.handle().equals(user.getHandle())) {
            if (userRepository.existsByHandle(req.handle())) {
                throw new PagemateException(ErrorCode.DUPLICATE_HANDLE);
            }
            user.updateHandle(req.handle());
        }

        user.updateProfile(
                req.nickname(),
                req.bio(),
                req.location(),
                null,
                req.genres(),
                null
        );

        return buildProfileResponse(user, userId);
    }

    @Transactional
    public void updateLocation(Long userId, BigDecimal lat, BigDecimal lng) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        user.updateLocation(lat, lng);
    }

    /** Expo 푸시 토큰 등록/갱신 (앱 로그인 시 호출) */
    @Transactional
    public void updatePushToken(Long userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        user.updateFcmToken(token);
    }

    /** 알림(푸시) on/off 설정 변경 */
    @Transactional
    public ProfileResponse updatePushEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        user.updatePushEnabled(enabled);
        return buildProfileResponse(user, userId);
    }

    /**
     * 계정 삭제(탈퇴). App Store 심사 지침 5.1.1(v) 요구사항.
     * 거래·채팅·리뷰가 사용자 행을 참조하므로 행을 지우는 대신 개인정보를 모두 제거하고
     * 진행 중인 대여를 정리한다. 같은 소셜 계정으로 다시 로그인하면 새 계정이 생성된다.
     */
    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        if (user.isDeleted()) {
            throw new PagemateException(ErrorCode.USER_NOT_FOUND);
        }

        // 상대방이 무기한 대기하지 않도록 진행 중인 대여를 모두 취소한다
        exchangeRepository.findByUserIdAndStatusIn(userId, ACTIVE_EXCHANGE_STATUSES)
                .forEach(Exchange::cancel);

        // 등록한 도서는 거래 이력이 참조하므로 행을 남기되,
        // 대여 목록 조회에서 탈퇴 사용자의 도서를 제외한다 (BookQueryRepository.findBooks)

        notificationRepository.deleteAllByUserId(userId);

        if (user.getProfileImage() != null) {
            imageStorage.delete(user.getProfileImage());
        }

        user.softDelete();
    }

    public ProfileResponse getUserProfile(Long viewerId, Long targetId) {
        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        // 차단 관계인 상대의 프로필은 노출하지 않는다
        if (user.isDeleted() || blockService.isBlockedBetween(viewerId, targetId)) {
            throw new PagemateException(ErrorCode.USER_NOT_FOUND);
        }
        return buildProfileResponse(user, targetId);
    }

    public BookPageResponse<BookSummaryResponse> getUserBooks(Long viewerId, Long targetId, int page, int size) {
        if (!userRepository.existsByIdAndDeletedAtIsNull(targetId)
                || blockService.isBlockedBetween(viewerId, targetId)) {
            throw new PagemateException(ErrorCode.USER_NOT_FOUND);
        }
        return BookPageResponse.of(
                bookQueryRepository.findMyBooks(targetId, null, PageRequest.of(page, size)),
                b -> BookSummaryResponse.of(b)
        );
    }

    private ProfileResponse buildProfileResponse(User user, Long userId) {
        int bookCount = bookRepository.countByOwnerId(userId);
        int exchangeCount = (int) exchangeRepository.countByUserIdAndStatus(userId, ExchangeStatus.COMPLETED);
        double averageRating = reviewRepository.averageRatingByRevieweeId(userId);
        int reviewCount = (int) reviewRepository.countByRevieweeId(userId);
        return ProfileResponse.of(user, bookCount, exchangeCount, averageRating, reviewCount);
    }
}
