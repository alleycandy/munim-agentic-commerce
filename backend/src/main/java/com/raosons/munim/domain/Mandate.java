package com.raosons.munim.domain;

import com.raosons.munim.domain.enums.BuyerKind;
import com.raosons.munim.domain.enums.MandateStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A bounded authority to spend up to maxPaise, for a named buyer and a
 * purpose, with an expiry. Not a saved card. Mirrors Mandate in policy.ts.
 */
@Entity
@Table(name = "mandate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mandate {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ShopSession session;

    @Column(name = "quote_id")
    private UUID quoteId;

    @Column(name = "max_paise", nullable = false)
    private long maxPaise;

    @Column(nullable = false, length = 300)
    private String purpose;

    @Column(nullable = false, length = 160)
    private String buyer;

    @Enumerated(EnumType.STRING)
    @Column(name = "buyer_kind", nullable = false, length = 10)
    private BuyerKind buyerKind;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MandateStatus status;

    @Column(length = 400)
    private String reason;

    @Column(nullable = false)
    @Builder.Default
    private int retries = 0;
}
