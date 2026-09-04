package com.raosons.munim.dto;

import jakarta.validation.constraints.NotBlank;

public record SetBuyerNameRequest(@NotBlank String buyerName) {}
