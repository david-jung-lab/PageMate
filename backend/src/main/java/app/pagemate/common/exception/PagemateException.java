package app.pagemate.common.exception;

import lombok.Getter;

@Getter
public class PagemateException extends RuntimeException {

    private final ErrorCode errorCode;

    public PagemateException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
