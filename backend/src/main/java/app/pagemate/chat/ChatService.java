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
    private final ChatRoomParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoomSummaryResponse createRoom(Long requesterId, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        return chatRoomRepository.findByBookIdAndRequesterId(bookId, requesterId)
                .map(room -> {
                    long unread = getUnreadCount(room.getId(), requesterId);
                    return ChatRoomSummaryResponse.of(room, requesterId, unread);
                })
                .orElseGet(() -> {
                    User requester = userRepository.findById(requesterId)
                            .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
                    ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                            .book(book)
                            .requester(requester)
                            .owner(book.getOwner())
                            .build());
                    initParticipants(room, requester, book.getOwner());
                    sendSystemMessage(room, "교환 요청이 시작되었어요.");
                    return ChatRoomSummaryResponse.of(room, requesterId, 0);
                });
    }

    public List<ChatRoomSummaryResponse> getRooms(Long userId) {
        return chatRoomRepository.findAllByUserId(userId).stream()
                .map(room -> {
                    long unread = getUnreadCount(room.getId(), userId);
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

        Message message = messageRepository.save(Message.builder()
                .chatRoom(room)
                .sender(sender)
                .content(content)
                .messageType(MessageType.TEXT)
                .build());

        room.updateLastMessage(content);
        markReadForUser(room.getId(), senderId, message.getId());

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
        messageRepository.findLatestByRoomId(roomId)
                .ifPresent(latest -> markReadForUser(roomId, userId, latest.getId()));
    }

    private void initParticipants(ChatRoom room, User requester, User owner) {
        participantRepository.save(ChatRoomParticipant.builder()
                .id(new ChatRoomParticipantId(room.getId(), requester.getId()))
                .chatRoom(room).user(requester).build());
        participantRepository.save(ChatRoomParticipant.builder()
                .id(new ChatRoomParticipantId(room.getId(), owner.getId()))
                .chatRoom(room).user(owner).build());
    }

    private void markReadForUser(Long roomId, Long userId, Long messageId) {
        participantRepository.findByRoomIdAndUserId(roomId, userId)
                .ifPresent(p -> p.markRead(messageId));
    }

    private long getUnreadCount(Long roomId, Long userId) {
        return participantRepository.findByRoomIdAndUserId(roomId, userId)
                .map(p -> messageRepository.countUnreadAfter(roomId, p.getLastReadMessageId()))
                .orElse(0L);
    }

    private void sendSystemMessage(ChatRoom room, String content) {
        Message message = messageRepository.save(Message.builder()
                .chatRoom(room)
                .sender(null)
                .content(content)
                .messageType(MessageType.SYSTEM)
                .build());
        room.updateLastMessage(content);
        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), MessageResponse.of(message));
    }
}
