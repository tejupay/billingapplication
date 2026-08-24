package com.businesserp.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    @Column(nullable = false)
    private String productName;

    private String hsnCode;

    @Column(nullable = false)
    private Double quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = true, precision = 5, scale = 2)
    private BigDecimal taxRate; // GST %

    @Column(nullable = true, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(nullable = true, precision = 12, scale = 2)
    private BigDecimal totalPrice;
}
