package app.pagemate.book.dto;

import app.pagemate.book.BookCondition;
import jakarta.validation.constraints.Size;

public record BookUpdateRequest(
        BookCondition condition,
        @Size(max = 200) String description,
        String coverColor
) {}
