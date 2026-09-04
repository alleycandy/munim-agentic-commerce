package com.raosons.munim.domain.enums;

public enum Category {
    RICE("Rice & poha"),
    ATTA("Flours"),
    OIL("Oils"),
    SPICE("Masala"),
    PICKLE("Pickle"),
    TEA("Tea"),
    PAPAD("Papad"),
    PULSE("Dal"),
    SWEET("Gul & snack"),
    DAIRY("Dairy");

    private final String label;

    Category(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
