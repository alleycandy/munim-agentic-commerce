package com.raosons.munim.dto;

import jakarta.validation.constraints.NotBlank;

public record SendChatRequest(@NotBlank String text) {}
