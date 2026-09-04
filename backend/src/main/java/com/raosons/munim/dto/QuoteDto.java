package com.raosons.munim.dto;

import java.util.List;
import java.util.UUID;

public record QuoteDto(
    UUID id,
    List<QuoteLineDto> lines,
    long subtotalPaise,
    long gstPaise,
    long totalPaise,
    List<String> warnings,
    List<String> blockers
) {
    public boolean blocked() {
        return blockers != null && !blockers.isEmpty();
    }
}
