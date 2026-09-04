package com.raosons.munim.service;

import java.text.NumberFormat;
import java.util.Locale;

/** Formats paise as a whole-rupee INR string, e.g. 79800L -> "Rs 798". */
final class MoneyFormatter {

    private static final Locale EN_IN = new Locale("en", "IN");

    private MoneyFormatter() {}

    static String inr(long paise) {
        NumberFormat format = NumberFormat.getCurrencyInstance(EN_IN);
        format.setMaximumFractionDigits(0);
        format.setMinimumFractionDigits(0);
        double rupees = paise / 100.0;
        String formatted = format.format(rupees);
        // Some JVMs render the Rupee sign as a currency-symbol code point that
        // doesn't render everywhere; normalise to a plain "Rs" prefix for a
        // dependable ASCII-safe API response.
        return formatted.replaceFirst("^[^0-9-]+", "Rs ");
    }

    /** Plain rupee number (no currency symbol, no thousands grouping) - e.g. 79800L -> "798". */
    static String plainRupees(long paise) {
        if (paise % 100 == 0) {
            return String.valueOf(paise / 100);
        }
        return String.valueOf(paise / 100.0);
    }
}
