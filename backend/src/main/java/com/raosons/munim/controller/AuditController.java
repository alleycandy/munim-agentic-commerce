package com.raosons.munim.controller;

import com.raosons.munim.dto.AuditEventDto;
import com.raosons.munim.service.AuditService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public List<AuditEventDto> latest(
        @RequestParam(name = "limit", defaultValue = "50") int limit,
        @RequestParam(name = "sessionId", required = false) UUID sessionId
    ) {
        return sessionId == null ? auditService.latest(limit) : auditService.latestForSession(sessionId, limit);
    }
}
