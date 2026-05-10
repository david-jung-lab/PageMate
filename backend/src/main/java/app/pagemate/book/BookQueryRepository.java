package app.pagemate.book;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class BookQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Page<Book> findBooks(String keyword, String genre, String neighborhood, Pageable pageable) {
        QBook book = QBook.book;
        BooleanBuilder builder = buildFilter(keyword, genre, neighborhood);
        builder.and(book.status.eq(BookStatus.AVAILABLE));

        List<Book> content = queryFactory.selectFrom(book)
                .where(builder)
                .orderBy(book.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        long total = queryFactory.selectFrom(book).where(builder).fetch().size();
        return new PageImpl<>(content, pageable, total);
    }

    public Page<Book> findMyBooks(Long userId, BookStatus status, Pageable pageable) {
        QBook book = QBook.book;
        BooleanBuilder builder = new BooleanBuilder();
        builder.and(book.owner.id.eq(userId));
        if (status != null) builder.and(book.status.eq(status));

        List<Book> content = queryFactory.selectFrom(book)
                .where(builder)
                .orderBy(book.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        long total = queryFactory.selectFrom(book).where(builder).fetch().size();
        return new PageImpl<>(content, pageable, total);
    }

    private BooleanBuilder buildFilter(String keyword, String genre, String neighborhood) {
        QBook book = QBook.book;
        BooleanBuilder builder = new BooleanBuilder();
        if (StringUtils.hasText(keyword)) {
            builder.and(book.title.containsIgnoreCase(keyword)
                    .or(book.author.containsIgnoreCase(keyword))
                    .or(book.isbn.eq(keyword)));
        }
        if (StringUtils.hasText(genre)) builder.and(book.genre.eq(genre));
        if (StringUtils.hasText(neighborhood)) builder.and(book.neighborhood.containsIgnoreCase(neighborhood));
        return builder;
    }
}
