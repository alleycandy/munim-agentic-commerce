package com.raosons.munim.dto;

import java.util.List;

public record CatalogForAgentsResponse(
    AgentMerchant merchant,
    List<ProductAgentDto> products
) {
    public record AgentMerchant(
        String name,
        String gstin,
        String address,
        String hours,
        String razorpay_account,
        String currency,
        String protocol
    ) {}
}
