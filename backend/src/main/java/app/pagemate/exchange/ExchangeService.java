package app.pagemate.exchange;

import app.pagemate.block.BlockService;
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
import app.pagemate.exchange.dto.CompleteRequest;
import app.pagemate.exchange.dto.ExchangeCreateRequest;
import app.pagemate.exchange.dto.ExchangeResponse;
import app.pagemate.exchange.dto.RespondRequest;
import app.pagemate.exchange.dto.ScheduleRequest;
import app.pagemate.notification.NotificationService;
import app.pagemate.notification.NotificationType;
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
    private final NotificationService notificationService;
    private final BlockService blockService;

    @Transactional
    public ExchangeResponse createExchange(Long requesterId, ExchangeCreateRequest req) {
        User requester = getUser(requesterId);
        Book targetBook = getBook(req.getTargetBookId());

        if (targetBook.getOwner().getId().equals(requesterId)) {
            throw new PagemateException(ErrorCode.SELF_EXCHANGE);
        }
        // 차단 관계면 새 대여 요청을 보낼 수 없다
        blockService.assertNotBlocked(requesterId, targetBook.getOwner().getId());
        if (targetBook.getStatus() != BookStatus.AVAILABLE) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        boolean duplicate = exchangeRepository.existsByRequesterIdAndRequestedBookIdAndStatusIn(
                requesterId, req.getTargetBookId(),
                List.of(ExchangeStatus.PENDING, ExchangeStatus.ACCEPTED));
        if (duplicate) {
            throw new PagemateException(ErrorCode.DUPLICATE_REQUEST);
        }

        Exchange exchange = Exchange.builder()
                .requester(requester)
                .respondent(targetBook.getOwner())
                .requestedBook(targetBook)
                .build();

        Exchange saved = exchangeRepository.save(exchange);

        notificationService.send(
                targetBook.getOwner().getId(),
                NotificationType.EXCHANGE_REQUEST,
                requester.getNickname() + "님이 교환을 요청했어요.",
                saved.getId()
        );

        return ExchangeResponse.of(saved);
    }

    public Page<ExchangeResponse> getMyExchanges(Long userId, ExchangeStatus status, int page, int size) {
        return exchangeRepository
                .findMyExchanges(userId, status, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public ExchangeResponse getExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);
        return toResponse(exchange);
    }

    public List<ExchangeResponse.BookInfo> getRequesterBooks(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        if (!exchange.getRespondent().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
        return bookRepository.findByOwnerIdAndStatus(
                exchange.getRequester().getId(), BookStatus.AVAILABLE
        ).stream().map(ExchangeResponse.BookInfo::of).toList();
    }

    @Transactional
    public ExchangeResponse respondToExchange(Long userId, Long exchangeId, RespondRequest req) {
        Exchange exchange = getExchangeById(exchangeId);

        if (!exchange.getRespondent().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.EXCHANGE_ACCESS_DENIED);
        }
        if (exchange.getStatus() != ExchangeStatus.PENDING) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        if ("ACCEPT".equals(req.getAction())) {
            if (req.getSelectedBookId() == null) {
                throw new PagemateException(ErrorCode.BOOK_NOT_FOUND);
            }
            Book selectedBook = getBook(req.getSelectedBookId());
            if (!selectedBook.getOwner().getId().equals(exchange.getRequester().getId())) {
                throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
            }
            if (selectedBook.getStatus() != BookStatus.AVAILABLE) {
                throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
            }

            exchange.accept(selectedBook);
            exchange.getRequestedBook().updateStatus(BookStatus.IN_PROGRESS);
            selectedBook.updateStatus(BookStatus.IN_PROGRESS);

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
                                .content("교환이 수락되었어요. 약속문에 동의한 후 만남 장소를 정해보세요!")
                                .messageType(MessageType.SYSTEM)
                                .build());
                        newRoom.updateLastMessage(sysMsg.getContent());
                        return newRoom;
                    });

            notificationService.send(
                    exchange.getRequester().getId(),
                    NotificationType.EXCHANGE_ACCEPTED,
                    exchange.getRespondent().getNickname() + "님이 교환을 수락했어요.",
                    exchangeId
            );

            return ExchangeResponse.of(exchange, room.getId());

        } else if ("REJECT".equals(req.getAction())) {
            exchange.reject();

            notificationService.send(
                    exchange.getRequester().getId(),
                    NotificationType.EXCHANGE_REJECTED,
                    exchange.getRespondent().getNickname() + "님이 교환을 거절했어요.",
                    exchangeId
            );

            return ExchangeResponse.of(exchange);

        } else {
            throw new PagemateException(ErrorCode.VALIDATION_ERROR);
        }
    }

    // WF7: 약속문 동의 - ACCEPTED 상태에서 양측이 순서대로 동의 → 둘 다 동의 시 PLEDGED
    @Transactional
    public ExchangeResponse pledgeExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);

        if (exchange.getStatus() != ExchangeStatus.ACCEPTED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        boolean isRequester = exchange.getRequester().getId().equals(userId);

        if (isRequester) {
            if (exchange.isRequesterPledged()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.pledgeByRequester();
        } else {
            if (exchange.isRespondentPledged()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.pledgeByRespondent();
        }

        Long partnerId = isRequester ? exchange.getRespondent().getId() : exchange.getRequester().getId();
        String myNickname = isRequester ? exchange.getRequester().getNickname() : exchange.getRespondent().getNickname();

        if (exchange.getStatus() == ExchangeStatus.PLEDGED) {
            // 양측 모두 동의 → 시스템 메시지 + 양측 알림
            chatRoomRepository.findByExchangeId(exchangeId).ifPresent(room -> {
                Message sysMsg = messageRepository.save(Message.builder()
                        .chatRoom(room)
                        .sender(null)
                        .content("두 분 모두 약속문에 동의했어요. 만남 일정을 정해보세요!")
                        .messageType(MessageType.SYSTEM)
                        .build());
                room.updateLastMessage(sysMsg.getContent());
            });
            notificationService.send(exchange.getRequester().getId(), NotificationType.PLEDGE_REQUESTED,
                    "약속문 동의가 완료됐어요. 만남 일정을 잡아보세요!", exchangeId);
            notificationService.send(exchange.getRespondent().getId(), NotificationType.PLEDGE_REQUESTED,
                    "약속문 동의가 완료됐어요. 만남 일정을 잡아보세요!", exchangeId);
        } else {
            // 한 명만 동의 → 상대방에게 알림
            notificationService.send(partnerId, NotificationType.PLEDGE_REQUESTED,
                    myNickname + "님이 약속문에 동의했어요.", exchangeId);
        }

        return toResponse(exchange);
    }

    // WF8: 일정 확정 - PLEDGED 상태에서 날짜/장소 입력 → SCHEDULED
    @Transactional
    public ExchangeResponse scheduleExchange(Long userId, Long exchangeId, ScheduleRequest req) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);

        if (exchange.getStatus() != ExchangeStatus.PLEDGED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        exchange.schedule(req.getExchangeDate(), req.getPlace());

        chatRoomRepository.findByExchangeId(exchangeId).ifPresent(room -> {
            String content = req.getExchangeDate() + " " + req.getPlace() + "에서 교환하기로 했어요!";
            Message sysMsg = messageRepository.save(Message.builder()
                    .chatRoom(room)
                    .sender(null)
                    .content(content)
                    .messageType(MessageType.SYSTEM)
                    .build());
            room.updateLastMessage(sysMsg.getContent());
        });

        return toResponse(exchange);
    }

    // WF9: 1차 교환 완료 - SCHEDULED 상태에서 양측이 각각 확인 → 둘 다 확인 시 FIRST_EXCHANGED
    @Transactional
    public ExchangeResponse completeExchange(Long userId, Long exchangeId, CompleteRequest req) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);

        if (exchange.getStatus() != ExchangeStatus.SCHEDULED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        boolean isRequester = exchange.getRequester().getId().equals(userId);

        if (isRequester) {
            if (exchange.isRequesterFirstConfirmed()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.confirmFirstByRequester();
        } else {
            if (exchange.isRespondentFirstConfirmed()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.confirmFirstByRespondent();
        }

        Long partnerId = isRequester ? exchange.getRespondent().getId() : exchange.getRequester().getId();
        String myNickname = isRequester ? exchange.getRequester().getNickname() : exchange.getRespondent().getNickname();

        if (exchange.isFirstFullyConfirmed()) {
            // 양측 모두 확인 → 상태 전환 + 반납 기한 설정 + 시스템 메시지 + 양측 알림
            exchange.firstComplete(req.getDurationDays());

            chatRoomRepository.findByExchangeId(exchangeId).ifPresent(room -> {
                String content = "1차 교환이 완료됐어요. " + exchange.getDueDate() + "까지 책을 읽고 다시 만나요!";
                Message sysMsg = messageRepository.save(Message.builder()
                        .chatRoom(room)
                        .sender(null)
                        .content(content)
                        .messageType(MessageType.SYSTEM)
                        .build());
                room.updateLastMessage(sysMsg.getContent());
            });
            notificationService.send(exchange.getRequester().getId(), NotificationType.EXCHANGE_COMPLETED,
                    "1차 교환이 완료됐어요. " + exchange.getDueDate() + "까지 책을 읽어보세요!", exchangeId);
            notificationService.send(exchange.getRespondent().getId(), NotificationType.EXCHANGE_COMPLETED,
                    "1차 교환이 완료됐어요. " + exchange.getDueDate() + "까지 책을 읽어보세요!", exchangeId);
        } else {
            // 한 명만 확인 → 상대방에게 확인 알림
            notificationService.send(partnerId, NotificationType.EXCHANGE_COMPLETED,
                    myNickname + "님이 1차 교환을 확인했어요. 만남 후 교환을 완료해주세요!", exchangeId);
        }

        return toResponse(exchange);
    }

    // WF11: 2차 교환 완료 - FIRST_EXCHANGED 상태에서 양측이 각각 확인 → 둘 다 확인 시 SECOND_EXCHANGED
    @Transactional
    public ExchangeResponse completeSecondExchange(Long userId, Long exchangeId) {
        Exchange exchange = getExchangeById(exchangeId);
        checkParticipant(userId, exchange);

        if (exchange.getStatus() != ExchangeStatus.FIRST_EXCHANGED) {
            throw new PagemateException(ErrorCode.BOOK_NOT_AVAILABLE);
        }

        boolean isRequester = exchange.getRequester().getId().equals(userId);

        if (isRequester) {
            if (exchange.isRequesterSecondConfirmed()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.confirmSecondByRequester();
        } else {
            if (exchange.isRespondentSecondConfirmed()) {
                throw new PagemateException(ErrorCode.VALIDATION_ERROR);
            }
            exchange.confirmSecondByRespondent();
        }

        Long partnerId = isRequester ? exchange.getRespondent().getId() : exchange.getRequester().getId();
        String myNickname = isRequester ? exchange.getRequester().getNickname() : exchange.getRespondent().getNickname();

        if (exchange.isSecondFullyConfirmed()) {
            // 양측 모두 확인 → 상태 전환 + 도서 상태 갱신 + 시스템 메시지 + WF12 평가 요청 알림
            exchange.secondComplete();
            exchange.getRequestedBook().updateStatus(BookStatus.COMPLETED);
            if (exchange.getSelectedBook() != null) {
                exchange.getSelectedBook().updateStatus(BookStatus.COMPLETED);
            }

            chatRoomRepository.findByExchangeId(exchangeId).ifPresent(room -> {
                Message sysMsg = messageRepository.save(Message.builder()
                        .chatRoom(room)
                        .sender(null)
                        .content("교환독서가 모두 완료됐어요. 서로를 평가해보세요!")
                        .messageType(MessageType.SYSTEM)
                        .build());
                room.updateLastMessage(sysMsg.getContent());
            });
            notificationService.send(exchange.getRequester().getId(), NotificationType.REVIEW_REQUESTED,
                    "교환독서가 완료됐어요. " + exchange.getRespondent().getNickname() + "님을 평가해주세요!", exchangeId);
            notificationService.send(exchange.getRespondent().getId(), NotificationType.REVIEW_REQUESTED,
                    "교환독서가 완료됐어요. " + exchange.getRequester().getNickname() + "님을 평가해주세요!", exchangeId);
        } else {
            // 한 명만 확인 → 상대방에게 확인 알림
            notificationService.send(partnerId, NotificationType.EXCHANGE_COMPLETED,
                    myNickname + "님이 2차 교환을 확인했어요. 책을 돌려받은 뒤 완료해주세요!", exchangeId);
        }

        return toResponse(exchange);
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

    private ExchangeResponse toResponse(Exchange e) {
        Long chatRoomId = chatRoomRepository.findByExchangeId(e.getId())
                .map(ChatRoom::getId)
                .orElse(null);
        return ExchangeResponse.of(e, chatRoomId);
    }

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
