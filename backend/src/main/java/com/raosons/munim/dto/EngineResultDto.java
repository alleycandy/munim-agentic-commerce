package com.raosons.munim.dto;

import java.util.List;

/**
 * Returned by cart/quote/mandate/capture endpoints alongside the updated
 * session state: short human-readable notes about what just happened,
 * mirroring EngineResult.notes in store.ts.
 */
public record EngineResultDto(
    List<String> notes,
    SessionStateDto state
) {}
