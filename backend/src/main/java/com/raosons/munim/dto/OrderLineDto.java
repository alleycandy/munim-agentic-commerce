package com.raosons.munim.dto;

public record OrderLineDto(
    String sku,
    String name,
    int qty,
    long unitPaise,
    int gstPct
) {}
