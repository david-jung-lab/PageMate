package app.pagemate.book;

import app.pagemate.book.dto.*;
import app.pagemate.common.exception.ErrorCode;
import app.pagemate.common.exception.PagemateException;
import app.pagemate.common.service.S3Service;
import app.pagemate.user.User;
import app.pagemate.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookQueryRepository bookQueryRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    @Transactional
    public BookDetailResponse createBook(Long userId, BookCreateRequest req) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new PagemateException(ErrorCode.USER_NOT_FOUND));

        String imageUrl = null;
        if (req.getImage() != null && !req.getImage().isEmpty()) {
            imageUrl = s3Service.upload(req.getImage(), "books");
        }
        if (imageUrl == null && req.getKakaoThumbnailUrl() != null) {
            imageUrl = req.getKakaoThumbnailUrl();
        }

        Book book = Book.builder()
                .owner(owner)
                .title(req.getTitle())
                .author(req.getAuthor())
                .publisher(req.getPublisher())
                .isbn(req.getIsbn())
                .genre(req.getGenre())
                .condition(req.getCondition())
                .description(req.getDescription())
                .imageUrl(imageUrl)
                .coverColor(req.getCoverColor() != null ? req.getCoverColor() : "sage")
                .lat(req.getLat() != null ? BigDecimal.valueOf(req.getLat()) : null)
                .lng(req.getLng() != null ? BigDecimal.valueOf(req.getLng()) : null)
                .build();

        bookRepository.save(book);
        int bookCount = bookRepository.countByOwnerId(owner.getId());
        return BookDetailResponse.of(book, null, bookCount, 0);
    }

    public BookPageResponse<BookSummaryResponse> getBooks(
            String keyword, String genre, BookCondition condition,
            Double lat, Double lng, Double radiusKm, String sort,
            int page, int size
    ) {
        if (lat != null && lng != null) {
            double radius = radiusKm != null ? radiusKm : 2.0;
            double latDelta = radius / 111.0;
            double lngDelta = radius / (111.0 * Math.cos(Math.toRadians(lat)));

            List<Book> books = bookQueryRepository.findBooksInBoundingBox(
                    keyword, genre, condition,
                    BigDecimal.valueOf(lat - latDelta), BigDecimal.valueOf(lat + latDelta),
                    BigDecimal.valueOf(lng - lngDelta), BigDecimal.valueOf(lng + lngDelta)
            );

            List<BookSummaryResponse> responses = books.stream()
                    .map(b -> {
                        Double dist = (b.getLat() != null && b.getLng() != null)
                                ? haversine(lat, lng, b.getLat().doubleValue(), b.getLng().doubleValue())
                                : null;
                        return BookSummaryResponse.of(b, dist);
                    })
                    .filter(r -> r.distance() == null || r.distance() <= radius)
                    .sorted("DISTANCE".equals(sort)
                            ? Comparator.comparingDouble(r -> r.distance() != null ? r.distance() : Double.MAX_VALUE)
                            : Comparator.comparing(BookSummaryResponse::createdAt, Comparator.reverseOrder()))
                    .toList();

            int from = Math.min(page * size, responses.size());
            int to = Math.min(from + size, responses.size());
            return BookPageResponse.ofList(responses.subList(from, to), responses.size(), page, size);
        }

        Page<Book> bookPage = bookQueryRepository.findBooks(keyword, genre, condition, PageRequest.of(page, size));
        return BookPageResponse.of(bookPage, b -> BookSummaryResponse.of(b, null));
    }

    public BookDetailResponse getBook(Long bookId, Double lat, Double lng) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        Double distance = null;
        if (lat != null && lng != null && book.getLat() != null && book.getLng() != null) {
            distance = haversine(lat, lng, book.getLat().doubleValue(), book.getLng().doubleValue());
        }

        int bookCount = bookRepository.countByOwnerId(book.getOwner().getId());
        return BookDetailResponse.of(book, distance, bookCount, 0);
    }

    @Transactional
    public BookDetailResponse updateBook(Long userId, Long bookId, BookUpdateRequest req) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        if (!book.getOwner().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
        }

        book.update(req.description(), req.condition(), req.coverColor());
        int bookCount = bookRepository.countByOwnerId(userId);
        return BookDetailResponse.of(book, null, bookCount, 0);
    }

    @Transactional
    public void deleteBook(Long userId, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new PagemateException(ErrorCode.BOOK_NOT_FOUND));

        if (!book.getOwner().getId().equals(userId)) {
            throw new PagemateException(ErrorCode.BOOK_ACCESS_DENIED);
        }

        if (book.getImageUrl() != null) {
            s3Service.delete(book.getImageUrl());
        }
        bookRepository.delete(book);
    }

    public BookPageResponse<BookSummaryResponse> getMyBooks(Long userId, BookStatus status, int page, int size) {
        Page<Book> bookPage = bookQueryRepository.findMyBooks(userId, status, PageRequest.of(page, size));
        return BookPageResponse.of(bookPage, b -> BookSummaryResponse.of(b, null));
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
