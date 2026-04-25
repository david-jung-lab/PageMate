package app.pagemate.user;

import app.pagemate.book.dto.BookPageResponse;
import app.pagemate.book.dto.BookSummaryResponse;
import app.pagemate.common.response.ApiResponse;
import app.pagemate.user.dto.OnboardRequest;
import app.pagemate.user.dto.ProfileResponse;
import app.pagemate.user.dto.ProfileUpdateRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ObjectMapper objectMapper;

    @GetMapping("/me")
    public ApiResponse<ProfileResponse> getMyProfile(@AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(profileService.getMyProfile(userId));
    }

    @PostMapping("/me/onboard")
    public ApiResponse<ProfileResponse> onboard(
            @AuthenticationPrincipal Long userId,
            @RequestBody OnboardRequest req
    ) {
        return ApiResponse.ok(profileService.onboard(userId, req));
    }

    @PatchMapping(value = "/me", consumes = "multipart/form-data")
    public ApiResponse<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String handle,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String avatarColor,
            @RequestParam(required = false) String tags,
            @RequestPart(required = false) MultipartFile image
    ) throws Exception {
        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setNickname(nickname);
        req.setHandle(handle);
        req.setBio(bio);
        req.setLocation(location);
        req.setAvatarColor(avatarColor);
        req.setImage(image);
        if (tags != null) {
            List<String> tagList = objectMapper.readValue(tags,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            req.setTags(tagList);
        }
        return ApiResponse.ok(profileService.updateMyProfile(userId, req));
    }

    @PatchMapping("/me/location")
    public ApiResponse<Void> updateLocation(
            @AuthenticationPrincipal Long userId,
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng
    ) {
        profileService.updateLocation(userId, lat, lng);
        return ApiResponse.ok(null);
    }

    @GetMapping("/me/books")
    public ApiResponse<BookPageResponse<BookSummaryResponse>> getMyBooks(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(profileService.getUserBooks(userId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileResponse> getUserProfile(@PathVariable Long id) {
        return ApiResponse.ok(profileService.getUserProfile(id));
    }

    @GetMapping("/{id}/books")
    public ApiResponse<BookPageResponse<BookSummaryResponse>> getUserBooks(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(profileService.getUserBooks(id, page, size));
    }
}
