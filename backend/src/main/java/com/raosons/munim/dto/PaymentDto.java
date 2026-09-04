package com.raosons.munim.dto;

import java.time.Instant;
import java.util.Map;

public record PaymentDto(
    String id,
    String mandateId,
    long amountPaise,
    String method,
    String status,
    String failureCode,
    String failureMessage,
    Instant createdAt,
    RazorpayShape razorpayShape
) {
    public record RazorpayShape(String entity, String currency, Map<String, String> notes) {}
}
