package com.raosons.munim.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditEventDto(
    UUID id,
    Instant at,
    String kind,
    String summary,
    Long moneyPaise,
    UUID sessionId,
    Map<String, String> detail
) {}
