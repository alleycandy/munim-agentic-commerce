package com.raosons.munim.dto;

import java.util.List;

public record ProductDto(
    String sku,
    String name,
    List<String> aliases,
    String category,
    String categoryLabel,
    String unit,
    int packQty,
    String packUnit,
    long pricePaise,
    long mrpPaise,
    int stock,
    int gstPct,
    String origin,
    String notesForAgents,
    List<String> substitutions,
    boolean perishable
) {}
