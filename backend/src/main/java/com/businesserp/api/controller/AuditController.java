package com.businesserp.api.controller;

import com.businesserp.api.model.AuditLog;
import com.businesserp.api.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/audit-logs")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepo;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam Long tenantId) {
        return ResponseEntity.ok(auditLogRepo.findByTenantIdOrderByTimestampDesc(tenantId));
    }
}
