package com.raosons.munim.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * One purchasing agent (or human) at the counter. Holds pointers to the
 * "current" quote / mandate / payment, exactly like the single-slot state in
 * the original store.ts: whenever the cart changes, these are cleared.
 */
@Entity
@Table(name = "shop_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopSession {

    @Id
    private UUID id;

    @Column(name = "buyer_name", nullable = false, length = 160)
    @Builder.Default
    private String buyerName = "";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "current_quote_id")
    private UUID currentQuoteId;

    @Column(name = "current_mandate_id")
    private UUID currentMandateId;

    @Column(name = "current_payment_id")
    private String currentPaymentId;

    public void clearEngineState() {
        this.currentQuoteId = null;
        this.currentMandateId = null;
        this.currentPaymentId = null;
    }
}
