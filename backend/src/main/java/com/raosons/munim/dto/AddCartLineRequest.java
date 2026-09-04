package com.raosons.munim.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AddCartLineRequest(
    @NotBlank String sku,
    @Min(1) int qty,
    String note
) {}
