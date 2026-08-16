package app.pagemate.common.security;

import app.pagemate.chat.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * STOMP 프레임 단위 인증·인가.
 * CONNECT 에서 JWT 검증을 강제하고, SUBSCRIBE 에서 해당 채팅방 참여자인지 확인한다.
 * 검증에 실패하면 예외를 던져 프레임을 거부한다(클라이언트에는 ERROR 프레임 전달).
 */
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    /** 허용되는 유일한 구독 대상: /topic/chat/{roomId} */
    private static final Pattern CHAT_TOPIC = Pattern.compile("^/topic/chat/(\\d+)$");

    private final JwtProvider jwtProvider;
    private final ChatRoomRepository chatRoomRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            authenticate(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscription(accessor);
        }
        return message;
    }

    /** CONNECT: Authorization 헤더의 JWT 를 검증하고 세션 사용자로 등록한다. */
    private void authenticate(StompHeaderAccessor accessor) {
        String bearer = accessor.getFirstNativeHeader("Authorization");
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new MessageDeliveryException("인증 토큰이 없습니다.");
        }

        String token = bearer.substring(7);
        if (!jwtProvider.isValid(token)) {
            throw new MessageDeliveryException("유효하지 않은 토큰입니다.");
        }

        Long userId = jwtProvider.getUserId(token);
        accessor.setUser(new UsernamePasswordAuthenticationToken(
                userId.toString(), null, List.of()));
    }

    /** SUBSCRIBE: 채팅방 토픽만 허용하며, 그 방의 참여자만 구독할 수 있다. */
    private void authorizeSubscription(StompHeaderAccessor accessor) {
        Long userId = currentUserId(accessor);
        if (userId == null) {
            throw new MessageDeliveryException("인증되지 않은 세션입니다.");
        }

        String destination = accessor.getDestination();
        Matcher matcher = destination == null ? null : CHAT_TOPIC.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw new MessageDeliveryException("허용되지 않은 구독 대상입니다.");
        }

        Long roomId = Long.parseLong(matcher.group(1));
        if (!chatRoomRepository.existsByIdAndParticipant(roomId, userId)) {
            throw new MessageDeliveryException("채팅방 참여자가 아닙니다.");
        }
        // 차단 관계가 되면 기존 참여자였더라도 실시간 수신을 끊는다
        if (chatRoomRepository.existsBlockedParticipant(roomId, userId)) {
            throw new MessageDeliveryException("차단된 사용자와의 대화입니다.");
        }
    }

    private Long currentUserId(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) return null;
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
