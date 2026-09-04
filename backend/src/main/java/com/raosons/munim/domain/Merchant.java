package com.raosons.munim.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Singleton row (id = 1) describing the shop itself. */
@Entity
@Table(name = "merchant")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Merchant {

    @Id
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "legal_name", nullable = false, length = 160)
    private String legalName;

    @Column(nullable = false)
    private int established;

    @Column(nullable = false, length = 240)
    private String address;

    @Column(nullable = false, length = 20)
    private String gstin;

    @Column(nullable = false, length = 120)
    private String hours;

    @Column(nullable = false, length = 40)
    private String phone;

    @Column(name = "munim_note", nullable = false, length = 200)
    private String munimNote;

    @Column(name = "razorpay_account", nullable = false, length = 80)
    private String razorpayAccount;

    @Column(nullable = false, length = 400)
    private String story;
}
