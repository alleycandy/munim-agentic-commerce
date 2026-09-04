package com.raosons.munim.service;

import com.raosons.munim.domain.*;
import com.raosons.munim.dto.*;

import java.util.List;

/** Pure entity -> DTO mapping. No side effects, no repository access. */
final class EntityMappers {

    private EntityMappers() {}

    static ProductDto toDto(Product p) {
        return new ProductDto(
            p.getSku(), p.getName(), p.getAliases(), p.getCategory().name().toLowerCase(),
            p.getCategory().getLabel(), p.getUnit(), p.getPackQty(), p.getPackUnit(),
            p.getPricePaise(), p.getMrpPaise(), p.getStock(), p.getGstPct(), p.getOrigin(),
            p.getNotesForAgents(), p.getSubstitutions(), p.isPerishable()
        );
    }

    static ProductAgentDto toAgentDto(Product p) {
        return new ProductAgentDto(
            p.getSku(), p.getName(), p.getAliases(), p.getCategory().name().toLowerCase(),
            p.getUnit(), p.getPackQty(), p.getPackUnit(),
            p.getPricePaise() / 100.0, p.getMrpPaise() / 100.0, "INR",
            p.getStock(), p.getGstPct(), p.getOrigin(), p.getNotesForAgents(),
            p.getSubstitutions(), p.isPerishable()
        );
    }

    static MerchantDto toDto(Merchant m) {
        return new MerchantDto(
            m.getName(), m.getLegalName(), m.getEstablished(), m.getAddress(), m.getGstin(),
            m.getHours(), m.getPhone(), m.getMunimNote(), m.getRazorpayAccount(), m.getStory()
        );
    }

    static PolicyDto toDto(Policy p) {
        return new PolicyDto(
            p.getMaxOrderPaise(), p.getAutoApproveBelowPaise(), p.getDailyCapPaise(),
            p.getBlockedCategories().stream().map(c -> c.name().toLowerCase()).toList(),
            p.isAllowCredit(), p.getMaxPaymentRetries(), p.getHoldMinutes(),
            p.isRequireNamedBuyer(), p.isTripNextPayment()
        );
    }

    static CartLineDto toDto(CartLine c, Product product) {
        return new CartLineDto(c.getSku(), product.getName(), c.getQty(), c.getUnitPaiseAtAdd(), c.getGstPctAtAdd(), c.getNote());
    }

    static QuoteLineDto toDto(QuoteLine l) {
        return new QuoteLineDto(l.getSku(), l.getName(), l.getQty(), l.getUnitPaise(), l.getGstPct());
    }

    static QuoteDto toDto(QuoteSnapshot q) {
        List<QuoteLineDto> lines = q.getLines().stream().map(EntityMappers::toDto).toList();
        return new QuoteDto(q.getId(), lines, q.getSubtotalPaise(), q.getGstPaise(), q.getTotalPaise(), q.getWarnings(), q.getBlockers());
    }

    static MandateDto toDto(Mandate m) {
        return new MandateDto(
            m.getId(), m.getQuoteId(), m.getMaxPaise(), m.getPurpose(), m.getBuyer(),
            m.getBuyerKind().name().toLowerCase(), m.getCreatedAt(), m.getExpiresAt(),
            m.getStatus().name().toLowerCase(), m.getReason(), m.getRetries()
        );
    }

    static PaymentDto toDto(Payment p) {
        var notes = java.util.Map.of(
            "mandate_id", p.getMandate().getId().toString(),
            "buyer", p.getMandate().getBuyer(),
            "purpose", p.getMandate().getPurpose(),
            "merchant", "Rao & Sons"
        );
        return new PaymentDto(
            p.getId(), p.getMandate().getId().toString(), p.getAmountPaise(),
            p.getMethod().name().toLowerCase(), p.getStatus().name().toLowerCase(),
            p.getFailureCode(), p.getFailureMessage(), p.getCreatedAt(),
            new PaymentDto.RazorpayShape("payment", "INR", notes)
        );
    }

    static OrderLineDto toDto(OrderLine l) {
        return new OrderLineDto(l.getSku(), l.getName(), l.getQty(), l.getUnitPaise(), l.getGstPct());
    }

    static OrderDto toDto(ShopOrder o) {
        List<OrderLineDto> lines = o.getLines().stream().map(EntityMappers::toDto).toList();
        return new OrderDto(
            o.getId(), o.getSession() == null ? null : o.getSession().getId(), o.getMandateId(),
            o.getPaymentId(), o.getBuyer(), lines, o.getTotalPaise(),
            o.getStatus().name().toLowerCase(), o.getCreatedAt(), o.getNote()
        );
    }

    static AuditEventDto toDto(AuditEvent a) {
        return new AuditEventDto(a.getId(), a.getAt(), a.getKind().name().toLowerCase(), a.getSummary(), a.getMoneyPaise(), a.getSessionId(), a.getDetail());
    }

    static ChatMessageDto toDto(ChatMessage c) {
        return new ChatMessageDto(c.getId(), c.getRole().name().toLowerCase(), c.getText(), c.getAt());
    }
}
