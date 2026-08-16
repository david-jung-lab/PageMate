package app.pagemate.block;

import app.pagemate.block.dto.BlockedUserResponse;
import app.pagemate.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    /** 사용자 차단 */
    @PostMapping("/users/{targetId}/block")
    public ApiResponse<Void> block(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long targetId
    ) {
        blockService.block(userId, targetId);
        return ApiResponse.ok(null);
    }

    /** 차단 해제 */
    @DeleteMapping("/users/{targetId}/block")
    public ApiResponse<Void> unblock(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long targetId
    ) {
        blockService.unblock(userId, targetId);
        return ApiResponse.ok(null);
    }

    /** 내가 차단한 사용자 목록 */
    @GetMapping("/users/me/blocks")
    public ApiResponse<List<BlockedUserResponse>> getMyBlocks(
            @AuthenticationPrincipal Long userId
    ) {
        return ApiResponse.ok(blockService.getBlockedUsers(userId));
    }
}
