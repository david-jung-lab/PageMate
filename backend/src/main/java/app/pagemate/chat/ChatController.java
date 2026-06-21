package app.pagemate.chat;

import app.pagemate.chat.dto.*;
import app.pagemate.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    public ApiResponse<ChatRoomSummaryResponse> createRoom(
            @AuthenticationPrincipal Long userId,
            @RequestBody CreateRoomRequest req) {
        return ApiResponse.ok(chatService.createRoom(userId, req.bookId()));
    }

    @GetMapping("/rooms")
    public ApiResponse<List<ChatRoomSummaryResponse>> getRooms(
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.ok(chatService.getRooms(userId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ApiResponse<MessageCursorResponse> getMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long roomId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok(chatService.getMessages(userId, roomId, cursor, size));
    }

    @GetMapping("/rooms/{roomId}/exchange")
    public ApiResponse<ExchangeSummaryResponse> getRoomExchange(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long roomId) {
        return ApiResponse.ok(chatService.getRoomExchange(userId, roomId));
    }

    @PatchMapping("/rooms/{roomId}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long roomId) {
        chatService.markAsRead(userId, roomId);
        return ApiResponse.ok();
    }
}
