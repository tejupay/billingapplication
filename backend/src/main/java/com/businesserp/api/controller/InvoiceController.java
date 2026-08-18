package com.businesserp.api.controller;

import com.businesserp.api.model.*;
import com.businesserp.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceRepository invoiceRepo;
    private final ProductRepository productRepo;
    private final CustomerRepository customerRepo;
    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final AuditLogRepository auditLogRepo;

    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role
    ) {
        if ("EMPLOYEE".equalsIgnoreCase(role) && userId != null) {
            return ResponseEntity.ok(invoiceRepo.findByCreatedByIdOrderByCreatedAtDesc(userId));
        }
        return ResponseEntity.ok(invoiceRepo.findByTenantIdOrderByCreatedAtDesc(tenantId));
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice, @RequestParam Long tenantId, @RequestParam Long userId) {
        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        invoice.setTenant(tenant);
        invoice.setCreatedBy(user);

        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isEmpty()) {
            invoice.setInvoiceNumber("INV-" + System.currentTimeMillis() / 1000 + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        // Link parent invoice reference on items & adjust stock for TAX_INVOICE
        for (InvoiceItem item : invoice.getItems()) {
            item.setInvoice(invoice);

            if (invoice.getType() == InvoiceType.TAX_INVOICE && item.getProduct() != null && item.getProduct().getId() != null) {
                Product product = productRepo.findById(item.getProduct().getId()).orElse(null);
                if (product != null) {
                    double newQty = Math.max(0, product.getStockQuantity() - item.getQuantity());
                    product.setStockQuantity(newQty);
                    productRepo.save(product);
                }
            } else if (invoice.getType() == InvoiceType.SALES_RETURN && item.getProduct() != null && item.getProduct().getId() != null) {
                Product product = productRepo.findById(item.getProduct().getId()).orElse(null);
                if (product != null) {
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepo.save(product);
                }
            }
        }

        // Customer credit/balance update if unpaid / partial
        if (invoice.getCustomer() != null && invoice.getCustomer().getId() != null) {
            Customer customer = customerRepo.findById(invoice.getCustomer().getId()).orElse(null);
            if (customer != null) {
                BigDecimal balanceDue = invoice.getBalanceAmount();
                if (invoice.getType() == InvoiceType.SALES_RETURN) {
                    customer.setPendingBalance(customer.getPendingBalance().subtract(balanceDue).max(BigDecimal.ZERO));
                } else if (invoice.getType() == InvoiceType.TAX_INVOICE && balanceDue != null && balanceDue.compareTo(BigDecimal.ZERO) > 0) {
                    customer.setPendingBalance(customer.getPendingBalance().add(balanceDue));
                }
                customerRepo.save(customer);
            }
        }

        Invoice saved = invoiceRepo.save(invoice);

        auditLogRepo.save(AuditLog.builder()
                .action("INVOICE_CREATED")
                .performedByUsername(user.getUsername())
                .userRole(user.getRole().name())
                .details("Created " + saved.getType() + " #" + saved.getInvoiceNumber() + " Total: ₹" + saved.getGrandTotal())
                .tenant(tenant)
                .build());

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        // 1. Reverse stock changes for items
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                if (item.getProduct() != null && item.getProduct().getId() != null) {
                    Product product = productRepo.findById(item.getProduct().getId()).orElse(null);
                    if (product != null) {
                        if (invoice.getType() == InvoiceType.TAX_INVOICE) {
                            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                            productRepo.save(product);
                        } else if (invoice.getType() == InvoiceType.SALES_RETURN) {
                            product.setStockQuantity(Math.max(0, product.getStockQuantity() - item.getQuantity()));
                            productRepo.save(product);
                        }
                    }
                }
            }
        }

        // 2. Adjust customer balance if pending
        if (invoice.getCustomer() != null && invoice.getCustomer().getId() != null) {
            Customer customer = customerRepo.findById(invoice.getCustomer().getId()).orElse(null);
            if (customer != null && invoice.getBalanceAmount() != null) {
                BigDecimal currentBalance = customer.getPendingBalance() != null ? customer.getPendingBalance() : BigDecimal.ZERO;
                if (invoice.getType() == InvoiceType.TAX_INVOICE) {
                    customer.setPendingBalance(currentBalance.subtract(invoice.getBalanceAmount()).max(BigDecimal.ZERO));
                } else if (invoice.getType() == InvoiceType.SALES_RETURN) {
                    customer.setPendingBalance(currentBalance.add(invoice.getBalanceAmount()));
                }
                customerRepo.save(customer);
            }
        }

        // 3. Record Audit Log & Delete
        auditLogRepo.save(AuditLog.builder()
                .action("INVOICE_DELETED")
                .performedByUsername(invoice.getCreatedBy() != null ? invoice.getCreatedBy().getUsername() : "system")
                .userRole(invoice.getCreatedBy() != null && invoice.getCreatedBy().getRole() != null ? invoice.getCreatedBy().getRole().name() : "ADMIN")
                .details("Deleted Invoice #" + invoice.getInvoiceNumber() + " (Amount: ₹" + invoice.getGrandTotal() + ")")
                .tenant(invoice.getTenant())
                .build());

        invoiceRepo.delete(invoice);

        return ResponseEntity.ok(java.util.Map.of("message", "Invoice #" + invoice.getInvoiceNumber() + " deleted successfully"));
    }
}
