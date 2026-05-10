package app.pagemate.exchange;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.exchange.dto.CompleteRequest;
import app.pagemate.exchange.dto.ExchangeCreateRequest;
import app.pagemate.exchange.dto.ExchangeResponse;
import app.pagemate.exchange.dto.RespondRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exchanges")
@RequiredArgsConstructor
public class ExchangeController {

    private final ExchangeService exchangeService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExchangeResponse>> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ExchangeCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.createExchange(userId, req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExchangeResponse>>> getMyExchanges(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) ExchangeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.getMyExchanges(userId, status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExchangeResponse>> getExchange(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.getExchange(userId, id)));
    }

    @GetMapping("/{id}/requester-books")
    public ResponseEntity<ApiResponse<List<ExchangeResponse.BookInfo>>> getRequesterBooks(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.getRequesterBooks(userId, id)));
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponse<ExchangeResponse>> respond(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody RespondRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.respondToExchange(userId, id, req)));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ExchangeResponse>> complete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody CompleteRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.completeExchange(userId, id, req)));
    }

    @PatchMapping("/{id}/complete-second")
    public ResponseEntity<ApiResponse<ExchangeResponse>> completeSecond(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.completeSecondExchange(userId, id)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ExchangeResponse>> cancel(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.cancelExchange(userId, id)));
    }
}
