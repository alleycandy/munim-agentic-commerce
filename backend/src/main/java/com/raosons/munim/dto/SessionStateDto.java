package com.raosons.munim.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * The full picture of one counter session: cart, current quote, current
 * mandate, current payment, buyer name. Mirrors the slice of MunimState in
 * store.ts that a client actually renders.
 */
public record SessionStateDto(
    UUID id,
    String buyerName,
    Instant createdAt,
    List<CartLineDto> cart,
    QuoteDto quote,
    MandateDto mandate,
    PaymentDto payment
) {}
