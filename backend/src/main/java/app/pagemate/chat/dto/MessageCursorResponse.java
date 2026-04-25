package app.pagemate.chat.dto;

import java.util.List;

public record MessageCursorResponse(
        List<MessageResponse> messages,
        Long nextCursor,
        boolean hasMore
) {}
