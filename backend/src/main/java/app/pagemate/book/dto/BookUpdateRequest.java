package app.pagemate.book.dto;

import jakarta.validation.constraints.Size;

public record BookUpdateRequest(
        @Size(max = 200) String description,
        String coverColor
) {}
