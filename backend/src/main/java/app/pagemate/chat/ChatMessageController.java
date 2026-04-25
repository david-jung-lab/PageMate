package app.pagemate.chat;

import app.pagemate.chat.dto.MessageResponse;
import app.pagemate.chat.dto.SendMessageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatService chatService;

    @MessageMapping("/chat/{roomId}/send")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload SendMessageRequest req,
            Principal principal) {
        if (principal == null) return;
        Long senderId = Long.parseLong(principal.getName());
        chatService.sendMessage(senderId, roomId, req.content());
    }
}
