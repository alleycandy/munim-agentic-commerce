package com.raosons.munim.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageDto(UUID id, String role, String text, Instant at) {}
