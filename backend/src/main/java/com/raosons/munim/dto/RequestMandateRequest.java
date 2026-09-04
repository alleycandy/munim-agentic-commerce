package com.raosons.munim.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestMandateRequest(@NotBlank String purpose) {}
