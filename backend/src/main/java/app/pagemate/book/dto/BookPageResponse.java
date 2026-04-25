package app.pagemate.book.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record BookPageResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int currentPage,
        boolean hasNext
) {
    public static <T, E> BookPageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new BookPageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.hasNext()
        );
    }

    public static <T> BookPageResponse<T> ofList(List<T> content, long total, int page, int size) {
        int totalPages = (int) Math.ceil((double) total / size);
        return new BookPageResponse<>(
                content,
                total,
                totalPages,
                page,
                (long) (page + 1) * size < total
        );
    }
}
