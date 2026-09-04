package com.raosons.munim.dto;

import java.util.List;

/**
 * Every field optional: a PATCH-style partial update of the wall rules,
 * mirroring setPolicy(patch) in store.ts.
 */
public record PolicyUpdateRequest(
    Long maxOrderPaise,
    Long autoApproveBelowPaise,
    Long dailyCapPaise,
    List<String> blockedCategories,
    Boolean allowCredit,
    Integer maxPaymentRetries,
    Integer holdMinutes,
    Boolean requireNamedBuyer,
    Boolean tripNextPayment
) {}
