package com.raosons.munim.dto;

public record CartLineDto(
    String sku,
    String name,
    int qty,
    long unitPaise,
    int gstPct,
    String note
) {}
