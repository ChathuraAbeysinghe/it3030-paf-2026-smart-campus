package com.smartcampus.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidStatusTransitionException extends RuntimeException {

    private final String fromStatus;
    private final String toStatus;

    public InvalidStatusTransitionException(String fromStatus, String toStatus) {
        super(String.format("Invalid status transition from %s to %s", fromStatus, toStatus));
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
    }

    public String getFromStatus() { return fromStatus; }
    public String getToStatus() { return toStatus; }
}
