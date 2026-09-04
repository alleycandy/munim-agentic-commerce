package com.raosons.munim.domain;

import com.raosons.munim.domain.enums.Category;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * The "wall rules": the desk's bounds on what an agent may buy, and how
 * money moves. Singleton row (id = 1). Mirrors policy.ts's Policy type.
 */
@Entity
@Table(name = "policy")
@Getter
@Setter
@NoArgsConstructor
public class Policy {

    @Id
    private Long id;

    @Column(name = "max_order_paise", nullable = false)
    private long maxOrderPaise;

    @Column(name = "auto_approve_below_paise", nullable = false)
    private long autoApproveBelowPaise;

    @Column(name = "daily_cap_paise", nullable = false)
    private long dailyCapPaise;

    @Column(name = "allow_credit", nullable = false)
    private boolean allowCredit;

    @Column(name = "max_payment_retries", nullable = false)
    private int maxPaymentRetries;

    @Column(name = "hold_minutes", nullable = false)
    private int holdMinutes;

    @Column(name = "require_named_buyer", nullable = false)
    private boolean requireNamedBuyer;

    /** Demo lever: expires the very next payment capture, then resets itself. */
    @Column(name = "trip_next_payment", nullable = false)
    private boolean tripNextPayment;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "policy_blocked_category", joinColumns = @JoinColumn(name = "policy_id"))
    @Column(name = "category")
    private List<Category> blockedCategories = new ArrayList<>();
}
