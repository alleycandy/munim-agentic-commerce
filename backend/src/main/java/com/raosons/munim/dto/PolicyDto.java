package com.raosons.munim.dto;

import java.util.List;

public record PolicyDto(
    long maxOrderPaise,
    long autoApproveBelowPaise,
    long dailyCapPaise,
    List<String> blockedCategories,
    boolean allowCredit,
    int maxPaymentRetries,
    int holdMinutes,
    boolean requireNamedBuyer,
    boolean tripNextPayment
) {}
