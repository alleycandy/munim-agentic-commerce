package com.raosons.munim.exception;

import org.springframework.http.HttpStatus;

/** A rule the deterministic engine refused to bend - e.g. unknown SKU, bad quantity. */
public class EngineException extends ApiException {
    public EngineException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }
}
