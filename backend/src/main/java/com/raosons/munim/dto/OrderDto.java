package com.raosons.munim.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderDto(
    UUID id,
    UUID sessionId,
    UUID mandateId,
    String paymentId,
    String buyer,
    List<OrderLineDto> lines,
    long totalPaise,
    String status,
    Instant createdAt,
    String note
) {}
