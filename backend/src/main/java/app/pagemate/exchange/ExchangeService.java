package app.pagemate.exchange;

import app.pagemate.book.Book;
import app.pagemate.book.BookRepository;
import app.pagemate.book.BookStatus;
import app.pagemate.chat.ChatRoom;
import app.pagemate.chat.ChatRoomRepository;
import app.pagemate.chat.Message;
import app.pagemate.chat.MessageRepository;
import app.pagemate.chat.MessageType;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.exchange.dto.ExchangeCreateRequest;
import app.pagemate.exchange.dto.ExchangeResponse;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExchangeService {

    private final ExchangeRepository exchangeRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;

    @Transactional
    public ExchangeResponse createExchange(Long requesterId, ExchangeCreateRequest req) {
        User requester = getUser(requesterId);

        Book requestedBook = getBook(req.getRequestedBookId());
        Book offeredBook = getBook(req.getOfferedBookId());

        // 본인 도서에 요청 금지
        if (requestedBook.getOwner().getId().equals(requesterId)) {
            throw new PagemateException(ErrorCode.SELF_EXCHANGE);
        }

        // 제안 도서는 본인 소유여야 함
        if (!offeredBook.getOwner().getId().equals(requesterId)) {
            throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
        }

        // 두 도서 모두 AVAILABLE 상태여야 함
        if (requestedBook.getStatus() != BookStatus.AVAILABLE) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }
        if (offeredBook.getStatus() != BookStatus.AVAILABLE) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        // 이미 PENDING/ACCEPTED 중복 요청 방지
        boolean duplicate = exchangeRepository.existsByRequesterIdAndRequestedBookIdAndStatusIn(
                requesterId, req.getRequestedBookId(),
                List.of(ExchangeStatus.PENDING, ExchangeStatus.ACCEPTED));
        if (duplicate) {
            throw new PagemateException(ErrorCode.DUPLICATE_REQUEST);
        }

        Exchange exchange = Exchange.builder()
                .requester(requester)
                .respondent(requestedBook.getOwner())
                .requestedBook(requestedBook)
                .offeredBook(offeredBook)
                .build();

        return ExchangeResponse.of(exchangeRepository.save(exchange));
    }

    public Page<ExchangeResponse> getMyExchanges(Long userId, ExchangeStatus status, int page, int size) {
        return exchangeRepository
                .findMyExchanges(userId, status, PageRequest.of(page, size))
                .map(ExchangeResponse::of);
    }

    public ExchangeResponse getExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);
        return ExchangeResponse.of(exchange);
    }

    @Transactional
    public ExchangeResponse acceptExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);

        if (!exchange.getRespondent().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
        if (exchange.getStatus() != ExchangeStatus.PENDING) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        exchange.accept();
        exchange.getRequestedBook().updateStatus(BookStatus.IN_PROGRESS);
        exchange.getOfferedBook().updateStatus(BookStatus.IN_PROGRESS);

        // 교환 수락 시 채팅방 자동 생성
        ChatRoom room = chatRoomRepository.findByExchangeId(exchange.getId())
                .orElseGet(() -> {
                    ChatRoom newRoom = chatRoomRepository.save(ChatRoom.builder()
                            .book(exchange.getRequestedBook())
                            .requester(exchange.getRequester())
                            .owner(exchange.getRespondent())
                            .exchange(exchange)
                            .build());
                    Message sysMsg = messageRepository.save(Message.builder()
                            .chatRoom(newRoom)
                            .sender(null)
                            .content("교환이 수락되었어요. 만남 장소를 정해보세요!")
                            .messageType(MessageType.SYSTEM)
                            .build());
                    newRoom.updateLastMessage(sysMsg.getContent());
                    return newRoom;
                });

        return ExchangeResponse.of(exchange, room.getId());
    }

    @Transactional
    public ExchangeResponse rejectExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);

        if (!exchange.getRespondent().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
        if (exchange.getStatus() != ExchangeStatus.PENDING) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        exchange.reject();
        return ExchangeResponse.of(exchange);
    }

    @Transactional
    public ExchangeResponse completeExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);

        if (exchange.getStatus() != ExchangeStatus.ACCEPTED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        exchange.complete();
        exchange.getRequestedBook().updateStatus(BookStatus.COMPLETED);
        exchange.getOfferedBook().updateStatus(BookStatus.COMPLETED);
        return ExchangeResponse.of(exchange);
    }

    @Transactional
    public ExchangeResponse cancelExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);

        if (!exchange.getRequester().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
        if (exchange.getStatus() != ExchangeStatus.PENDING) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        exchange.cancel();
        return ExchangeResponse.of(exchange);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));
    }

    private Book getBook(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));
    }

    private Exchange getExchangeById(Long exchangeId) {
        return exchangeRepository.findById(exchangeId)
                .orElseThrow(() -> new PagemateException(ErrorCode.EXCHANGE_NOT_FOUND));
    }

    private void checkParticipant(Long userId, Exchange exchange) {
        boolean isParticipant = exchange.getRequester().getId().equals(userId)
                || exchange.getRespondent().getId().equals(userId);
        if (!isParticipant) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
    }
}
