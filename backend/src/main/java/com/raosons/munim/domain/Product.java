package com.raosons.munim.domain;

import com.raosons.munim.domain.enums.Category;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * A single SKU on the shelf at Rao & Sons. Prices are stored in paise so the
 * engine never touches a floating-point rupee.
 */
@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @Column(name = "sku", length = 40)
    private String sku;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 20)
    private Category category;

    @Column(nullable = false, length = 60)
    private String unit;

    @Column(name = "pack_qty", nullable = false)
    private int packQty;

    @Column(name = "pack_unit", nullable = false, length = 20)
    private String packUnit;

    @Column(name = "price_paise", nullable = false)
    private long pricePaise;

    @Column(name = "mrp_paise", nullable = false)
    private long mrpPaise;

    @Column(nullable = false)
    private int stock;

    /** Original stock level, used to reset the shelf via the "restock" operation. */
    @Column(name = "seed_stock", nullable = false)
    private int seedStock;

    @Column(name = "gst_pct", nullable = false)
    private int gstPct;

    @Column(nullable = false, length = 120)
    private String origin;

    @Column(name = "notes_for_agents", nullable = false, length = 500)
    private String notesForAgents;

    @Column(nullable = false)
    private boolean perishable;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_alias", joinColumns = @JoinColumn(name = "product_sku"))
    @Column(name = "alias")
    @Builder.Default
    private List<String> aliases = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_substitution", joinColumns = @JoinColumn(name = "product_sku"))
    @Column(name = "substitution_sku")
    @Builder.Default
    private List<String> substitutions = new ArrayList<>();
}
