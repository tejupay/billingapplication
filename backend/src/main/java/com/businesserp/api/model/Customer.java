package com.businesserp.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String email;
    private String gstin;

    @Column(columnDefinition = "TEXT")
    private String address;

    private BigDecimal creditLimit;
    private BigDecimal pendingBalance; // Outstanding due amount

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (pendingBalance == null) pendingBalance = BigDecimal.ZERO;
        if (creditLimit == null) creditLimit = BigDecimal.ZERO;
    }
}
