package com.raosons.munim.exception;

import org.springframework.http.HttpStatus;

/** Base type for all handled API errors; carries the HTTP status to return. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
