package app.pagemate.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    UNAUTHORIZED("인증 토큰이 없거나 만료되었습니다.", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("접근 권한이 없습니다.", HttpStatus.FORBIDDEN),
    INVALID_TOKEN("유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED),

    // User
    USER_NOT_FOUND("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    DUPLICATE_HANDLE("이미 사용 중인 핸들입니다.", HttpStatus.CONFLICT),

    // Book
    BOOK_NOT_FOUND("도서를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    KAKAO_API_ERROR("카카오 도서 검색 중 오류가 발생했습니다.", HttpStatus.BAD_GATEWAY),
    BOOK_NOT_AVAILABLE("교환 불가 상태의 도서입니다.", HttpStatus.BAD_REQUEST),
    BOOK_ACCESS_DENIED("본인 소유 도서만 수정할 수 있습니다.", HttpStatus.FORBIDDEN),

    // Exchange
    SELF_EXCHANGE("본인 도서에 교환 요청할 수 없습니다.", HttpStatus.BAD_REQUEST),
    DUPLICATE_REQUEST("이미 요청한 도서입니다.", HttpStatus.CONFLICT),
    EXCHANGE_NOT_FOUND("교환 요청을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    EXCHANGE_ACCESS_DENIED("교환 요청에 대한 권한이 없습니다.", HttpStatus.FORBIDDEN),

    // Chat
    CHAT_ROOM_NOT_FOUND("채팅방을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    CHAT_ACCESS_DENIED("채팅방 참여자만 접근할 수 있습니다.", HttpStatus.FORBIDDEN),

    // Reading Record
    READING_RECORD_NOT_FOUND("독서 기록을 찾을 수 없습니다.", HttpStatus.NOT_FOUND),

    // Common
    VALIDATION_ERROR("요청 값 검증에 실패했습니다.", HttpStatus.BAD_REQUEST),
    NOT_FOUND("리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    INTERNAL_ERROR("서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String message;
    private final HttpStatus status;
}
