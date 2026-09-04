package com.raosons.munim.dto;

/** buyerName is optional; it can also be set later, or set by the chat agent. */
public record CreateSessionRequest(String buyerName) {}
