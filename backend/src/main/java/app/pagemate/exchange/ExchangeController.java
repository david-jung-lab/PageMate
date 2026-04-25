package app.pagemate.exchange;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.exchange.dto.ExchangeCreateRequest;
import app.pagemate.exchange.dto.ExchangeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/exchanges")
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

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<ExchangeResponse>> accept(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.acceptExchange(userId, id)));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ExchangeResponse>> reject(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.rejectExchange(userId, id)));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ExchangeResponse>> complete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.completeExchange(userId, id)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<ExchangeResponse>> cancel(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(exchangeService.cancelExchange(userId, id)));
    }
}
