package app.pagemate.reading;

import app.pagemate.book.dto.BookPageResponse;
import app.pagemate.common.response.ApiResponse;
import app.pagemate.reading.dto.ReadingRecordRequest;
import app.pagemate.reading.dto.ReadingRecordResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/reading-records")
@RequiredArgsConstructor
public class ReadingRecordController {

    private final ReadingRecordService service;

    @GetMapping
    public ApiResponse<BookPageResponse<ReadingRecordResponse>> getMyRecords(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(service.getMyRecords(userId, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReadingRecordResponse> create(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid ReadingRecordRequest req
    ) {
        return ApiResponse.ok(service.create(userId, req));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ReadingRecordResponse> update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody ReadingRecordRequest req
    ) {
        return ApiResponse.ok(service.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        service.delete(userId, id);
    }
}
