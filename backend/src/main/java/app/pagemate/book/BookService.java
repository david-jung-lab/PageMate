package app.pagemate.book;

import app.pagemate.book.dto.*;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.exchange.ExchangeRepository;
import app.pagemate.exchange.ExchangeStatus;
import app.pagemate.review.ReviewRepository;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookQueryRepository bookQueryRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ExchangeRepository exchangeRepository;

    @Transactional
    public BookDetailResponse createBook(Long userId, BookCreateRequest req) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        Book book = Book.builder()
                .owner(owner)
                .title(req.getTitle())
                .author(req.getAuthor())
                .publisher(req.getPublisher())
                .isbn(req.getIsbn())
                .genre(req.getGenre())
                .description(req.getDescription())
                .imageUrl(req.getKakaoThumbnailUrl())
                .coverColor(req.getCoverColor() != null ? req.getCoverColor() : "sage")
                .neighborhood(req.getNeighborhood())
                .build();

        bookRepository.save(book);
        return buildBookDetailResponse(book, owner.getId());
    }

    public BookPageResponse<BookSummaryResponse> getBooks(
            String keyword, String genre, String neighborhood, String sort, int page, int size
    ) {
        Page<Book> bookPage = bookQueryRepository.findBooks(keyword, genre, neighborhood, PageRequest.of(page, size));
        return BookPageResponse.of(bookPage, BookSummaryResponse::of);
    }

    public BookDetailResponse getBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));
        return buildBookDetailResponse(book, book.getOwner().getId());
    }

    @Transactional
    public BookDetailResponse updateBook(Long userId, Long bookId, BookUpdateRequest req) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        if (!book.getOwner().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
        }

        book.update(req.description(), req.coverColor());
        return buildBookDetailResponse(book, userId);
    }

    @Transactional
    public void deleteBook(Long userId, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        if (!book.getOwner().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
        }

        bookRepository.delete(book);
    }

    public BookPageResponse<BookSummaryResponse> getMyBooks(Long userId, BookStatus status, int page, int size) {
        Page<Book> bookPage = bookQueryRepository.findMyBooks(userId, status, PageRequest.of(page, size));
        return BookPageResponse.of(bookPage, BookSummaryResponse::of);
    }

    private BookDetailResponse buildBookDetailResponse(Book book, Long ownerId) {
        int bookCount = bookRepository.countByOwnerId(ownerId);
        int exchangeCount = (int) exchangeRepository.countByUserIdAndStatus(ownerId, ExchangeStatus.COMPLETED);
        double averageRating = reviewRepository.averageRatingByRevieweeId(ownerId);
        int reviewCount = (int) reviewRepository.countByRevieweeId(ownerId);
        return BookDetailResponse.of(book, bookCount, exchangeCount, averageRating, reviewCount);
    }
}
