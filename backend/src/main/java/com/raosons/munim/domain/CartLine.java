package com.raosons.munim.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A line on the chit. unitPaiseAtAdd / gstPctAtAdd are captured when the line
 * is added; quoteCart re-reads the book price and warns if they drifted -
 * exactly like CartLine in policy.ts / store.ts.
 */
@Entity
@Table(name = "cart_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ShopSession session;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false)
    private int qty;

    @Column(length = 300)
    private String note;

    @Column(name = "unit_paise_at_add", nullable = false)
    private long unitPaiseAtAdd;

    @Column(name = "gst_pct_at_add", nullable = false)
    private int gstPctAtAdd;
}
