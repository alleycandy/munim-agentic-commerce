package com.raosons.munim.domain;

import com.raosons.munim.domain.enums.AuditKind;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** One line on the tape: every quote, block, retry, capture. Mirrors AuditEvent in policy.ts. */
@Entity
@Table(name = "audit_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {

    @Id
    private UUID id;

    @Column(nullable = false)
    private Instant at;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditKind kind;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(name = "money_paise")
    private Long moneyPaise;

    @Column(name = "session_id")
    private UUID sessionId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "audit_event_detail", joinColumns = @JoinColumn(name = "audit_event_id"))
    @MapKeyColumn(name = "detail_key")
    @Column(name = "detail_value", length = 300)
    @Builder.Default
    private Map<String, String> detail = new HashMap<>();
}
