package com.raosons.munim.dto;

import java.util.List;

/**
 * The agent-readable shape of a product - what a machine is allowed to know.
 * Mirrors catalogForAgents() in catalog.ts (snake_case keys, INR not paise).
 */
public record ProductAgentDto(
    String sku,
    String name,
    List<String> aliases,
    String category,
    String unit,
    int pack_qty,
    String pack_unit,
    double price_inr,
    double mrp_inr,
    String currency,
    int stock,
    int gst_pct,
    String origin,
    String notes,
    List<String> substitutions,
    boolean perishable
) {}
