package com.businesserp.api.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String designation;
    private String phone;
    private String email;
    
    private BigDecimal monthlySalary;
    private LocalDate joiningDate;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User userAccount; // Linked user login if any

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
}
