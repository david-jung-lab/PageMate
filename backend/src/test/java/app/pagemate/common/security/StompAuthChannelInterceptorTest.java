package app.pagemate.common.security;

import app.pagemate.chat.ChatRoomRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("StompAuthChannelInterceptor - 채팅 WebSocket 인증·인가")
class StompAuthChannelInterceptorTest {

    @Mock JwtProvider jwtProvider;
    @Mock ChatRoomRepository chatRoomRepository;

    @InjectMocks StompAuthChannelInterceptor interceptor;

    private Message<byte[]> frame(StompCommand command, Consumer<StompHeaderAccessor> customizer) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setLeaveMutable(true);
        customizer.accept(accessor);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private StompHeaderAccessor accessorOf(Message<?> message) {
        return StompHeaderAccessor.wrap(message);
    }

    @Test
    @DisplayName("CONNECT - 토큰이 없으면 연결을 거부한다")
    void connectWithoutToken() {
        Message<byte[]> message = frame(StompCommand.CONNECT, a -> { });

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("CONNECT - 위조/만료 토큰이면 연결을 거부한다")
    void connectWithInvalidToken() {
        given(jwtProvider.isValid("bad-token")).willReturn(false);
        Message<byte[]> message = frame(StompCommand.CONNECT,
                a -> a.setNativeHeader("Authorization", "Bearer bad-token"));

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("CONNECT - 유효한 토큰이면 사용자로 등록한다")
    void connectWithValidToken() {
        given(jwtProvider.isValid("good-token")).willReturn(true);
        given(jwtProvider.getUserId("good-token")).willReturn(7L);
        Message<byte[]> message = frame(StompCommand.CONNECT,
                a -> a.setNativeHeader("Authorization", "Bearer good-token"));

        interceptor.preSend(message, null);

        assertThat(accessorOf(message).getUser()).isNotNull();
        assertThat(accessorOf(message).getUser().getName()).isEqualTo("7");
    }

    @Test
    @DisplayName("SUBSCRIBE - 인증되지 않은 세션은 구독할 수 없다")
    void subscribeWithoutSession() {
        Message<byte[]> message = frame(StompCommand.SUBSCRIBE,
                a -> a.setDestination("/topic/chat/1"));

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE - 참여자가 아니면 남의 채팅방을 구독할 수 없다")
    void subscribeToOthersRoom() {
        given(chatRoomRepository.existsByIdAndParticipant(1L, 7L)).willReturn(false);
        Message<byte[]> message = frame(StompCommand.SUBSCRIBE, a -> {
            a.setDestination("/topic/chat/1");
            a.setUser(new UsernamePasswordAuthenticationToken("7", null, List.of()));
        });

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE - 채팅방 토픽 외의 대상은 구독할 수 없다")
    void subscribeToUnknownDestination() {
        Message<byte[]> message = frame(StompCommand.SUBSCRIBE, a -> {
            a.setDestination("/topic/**");
            a.setUser(new UsernamePasswordAuthenticationToken("7", null, List.of()));
        });

        assertThatThrownBy(() -> interceptor.preSend(message, null))
                .isInstanceOf(MessageDeliveryException.class);
    }

    @Test
    @DisplayName("SUBSCRIBE - 참여자는 자신의 채팅방을 구독할 수 있다")
    void subscribeToOwnRoom() {
        given(chatRoomRepository.existsByIdAndParticipant(1L, 7L)).willReturn(true);
        Message<byte[]> message = frame(StompCommand.SUBSCRIBE, a -> {
            a.setDestination("/topic/chat/1");
            a.setUser(new UsernamePasswordAuthenticationToken("7", null, List.of()));
        });

        assertThatCode(() -> interceptor.preSend(message, null)).doesNotThrowAnyException();
    }
}
