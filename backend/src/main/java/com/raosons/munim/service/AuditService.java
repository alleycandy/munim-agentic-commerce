package com.raosons.munim.service;

import com.raosons.munim.domain.AuditEvent;
import com.raosons.munim.domain.enums.AuditKind;
import com.raosons.munim.dto.AuditEventDto;
import com.raosons.munim.repository.AuditEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Every quote, block, retry, and capture is a line in the book. Mirrors event() in policy.ts. */
@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final Clock shopClock;

    public AuditService(AuditEventRepository auditEventRepository, Clock shopClock) {
        this.auditEventRepository = auditEventRepository;
        this.shopClock = shopClock;
    }

    public AuditEvent record(AuditKind kind, String summary, Long moneyPaise, UUID sessionId, Map<String, String> detail) {
        AuditEvent event = AuditEvent.builder()
            .id(UUID.randomUUID())
            .at(Instant.now(shopClock))
            .kind(kind)
            .summary(summary)
            .moneyPaise(moneyPaise)
            .sessionId(sessionId)
            .detail(detail == null ? Map.of() : detail)
            .build();
        return auditEventRepository.save(event);
    }

    public List<AuditEventDto> latest(int limit) {
        int bounded = Math.max(1, Math.min(limit, 500));
        return auditEventRepository.findAllByOrderByAtDesc(PageRequest.of(0, bounded))
            .stream().map(EntityMappers::toDto).toList();
    }

    public List<AuditEventDto> latestForSession(UUID sessionId, int limit) {
        int bounded = Math.max(1, Math.min(limit, 500));
        return auditEventRepository.findBySessionIdOrderByAtDesc(sessionId, PageRequest.of(0, bounded))
            .stream().map(EntityMappers::toDto).toList();
    }
}
