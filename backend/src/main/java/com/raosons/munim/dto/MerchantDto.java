package com.raosons.munim.dto;

public record MerchantDto(
    String name,
    String legal,
    int est,
    String address,
    String gstin,
    String hours,
    String phone,
    String munim,
    String razorpayAccount,
    String story
) {}
