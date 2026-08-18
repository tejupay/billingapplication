package com.businesserp.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // USER_CREATED, LOGIN_SUCCESS, INVOICE_CREATED, STOCK_UPDATED, PASSWORD_RESET

    private String performedByUsername;
    private String userRole;
    
    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;

    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
