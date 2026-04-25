package app.pagemate.user;

import app.pagemate.book.BookRepository;
import app.pagemate.book.BookStatus;
import app.pagemate.book.dto.BookPageResponse;
import app.pagemate.book.dto.BookSummaryResponse;
import app.pagemate.book.BookQueryRepository;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.service.S3Service;
import app.pagemate.user.dto.OnboardRequest;
import app.pagemate.user.dto.ProfileResponse;
import app.pagemate.user.dto.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookQueryRepository bookQueryRepository;
    private final S3Service s3Service;

    public ProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        int bookCount = bookRepository.countByOwnerId(userId);
        return ProfileResponse.of(user, bookCount);
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
                s3Service.delete(user.getProfileImage());
            }
            imageUrl = s3Service.upload(req.getImage(), "profiles");
        }

        user.updateProfile(
                req.getNickname(),
                req.getBio(),
                req.getLocation(),
                req.getAvatarColor(),
                req.getTags(),
                imageUrl
        );

        int bookCount = bookRepository.countByOwnerId(userId);
        return ProfileResponse.of(user, bookCount);
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

        int bookCount = bookRepository.countByOwnerId(userId);
        return ProfileResponse.of(user, bookCount);
    }

    @Transactional
    public void updateLocation(Long userId, BigDecimal lat, BigDecimal lng) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        user.updateLocation(lat, lng);
    }

    public ProfileResponse getUserProfile(Long targetId) {
        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
        int bookCount = bookRepository.countByOwnerId(targetId);
        return ProfileResponse.of(user, bookCount);
    }

    public BookPageResponse<BookSummaryResponse> getUserBooks(Long targetId, int page, int size) {
        if (!userRepository.existsById(targetId)) {
            throw new PagemateException(ErrorCode.USER_NOT_FOUND);
        }
        return BookPageResponse.of(
                bookQueryRepository.findMyBooks(targetId, BookStatus.AVAILABLE, PageRequest.of(page, size)),
                b -> BookSummaryResponse.of(b, null)
        );
    }
}
