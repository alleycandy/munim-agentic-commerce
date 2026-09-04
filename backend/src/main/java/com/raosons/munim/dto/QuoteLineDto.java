package com.raosons.munim.dto;

public record QuoteLineDto(
    String sku,
    String name,
    int qty,
    long unitPaise,
    int gstPct
) {}
