package com.raosons.munim.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A priced-from-the-book snapshot of a cart at a point in time. Mirrors
 * Quote in policy.ts. Persisted so a later mandate/capture request (a
 * separate HTTP call) can refer back to exactly what was quoted.
 */
@Entity
@Table(name = "quote_snapshot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteSnapshot {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ShopSession session;

    @Column(name = "subtotal_paise", nullable = false)
    private long subtotalPaise;

    @Column(name = "gst_paise", nullable = false)
    private long gstPaise;

    @Column(name = "total_paise", nullable = false)
    private long totalPaise;

    @Column(name = "buyer_name", length = 160)
    private String buyerName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderColumn(name = "line_order")
    @Builder.Default
    private List<QuoteLine> lines = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quote_warning", joinColumns = @JoinColumn(name = "quote_id"))
    @Column(name = "warning")
    @OrderColumn(name = "line_order")
    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quote_blocker", joinColumns = @JoinColumn(name = "quote_id"))
    @Column(name = "blocker")
    @OrderColumn(name = "line_order")
    @Builder.Default
    private List<String> blockers = new ArrayList<>();

    public boolean isBlocked() {
        return blockers != null && !blockers.isEmpty();
    }
}
