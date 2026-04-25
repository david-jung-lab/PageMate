package app.pagemate.chat;

import app.pagemate.book.Book;
import app.pagemate.book.BookRepository;
import app.pagemate.chat.dto.*;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoomSummaryResponse createRoom(Long requesterId, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        // 이미 채팅방이 있으면 기존 방 반환
        return chatRoomRepository.findByBookIdAndRequesterId(bookId, requesterId)
                .map(room -> ChatRoomSummaryResponse.of(room, requesterId, 0))
                .orElseGet(() -> {
                    User requester = userRepository.findById(requesterId)
                            .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
                    ChatRoom room = ChatRoom.builder()
                            .book(book)
                            .requester(requester)
                            .owner(book.getOwner())
                            .build();
                    chatRoomRepository.save(room);

                    // 시스템 메시지 자동 발송
                    sendSystemMessage(room, "교환 요청이 시작되었어요.");
                    return ChatRoomSummaryResponse.of(room, requesterId, 0);
                });
    }

    public List<ChatRoomSummaryResponse> getRooms(Long userId) {
        return chatRoomRepository.findAllByUserId(userId).stream()
                .map(room -> {
                    long unread = messageRepository.countUnread(room.getId(), userId);
                    return ChatRoomSummaryResponse.of(room, userId, unread);
                })
                .toList();
    }

    public MessageCursorResponse getMessages(Long userId, Long roomId, Long cursor, int size) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new PagemateException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        if (!room.isParticipant(userId)) {
            throw new PagemateException(ErrorCode.CHAT_ACCESS_DENIED);
        }

        List<Message> messages = messageRepository.findByRoomIdWithCursor(
                roomId, cursor, PageRequest.of(0, size + 1));

        boolean hasMore = messages.size() > size;
        List<MessageResponse> responses = messages.stream()
                .limit(size)
                .map(MessageResponse::of)
                .toList();

        Long nextCursor = hasMore ? responses.get(responses.size() - 1).id() : null;
        return new MessageCursorResponse(responses, nextCursor, hasMore);
    }

    @Transactional
    public MessageResponse sendMessage(Long senderId, Long roomId, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new PagemateException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        if (!room.isParticipant(senderId)) {
            throw new PagemateException(ErrorCode.CHAT_ACCESS_DENIED);
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        Message message = Message.builder()
                .chatRoom(room)
                .sender(sender)
                .content(content)
                .messageType(MessageType.TEXT)
                .isRead(false)
                .build();
        messageRepository.save(message);
        room.updateLastMessage(content);

        MessageResponse response = MessageResponse.of(message);
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, response);
        return response;
    }

    @Transactional
    public void markAsRead(Long userId, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new PagemateException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        if (!room.isParticipant(userId)) {
            throw new PagemateException(ErrorCode.CHAT_ACCESS_DENIED);
        }
        messageRepository.markAllAsRead(roomId, userId);
    }

    private void sendSystemMessage(ChatRoom room, String content) {
        Message message = Message.builder()
                .chatRoom(room)
                .sender(null)
                .content(content)
                .messageType(MessageType.SYSTEM)
                .isRead(true)
                .build();
        messageRepository.save(message);
        room.updateLastMessage(content);
        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), MessageResponse.of(message));
    }
}
