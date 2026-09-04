package com.raosons.munim.dto;

import java.time.Instant;
import java.util.UUID;

public record MandateDto(
    UUID id,
    UUID quoteId,
    long maxPaise,
    String purpose,
    String buyer,
    String buyerKind,
    Instant createdAt,
    Instant expiresAt,
    String status,
    String reason,
    int retries
) {}
