package com.businesserp.api.controller;

import com.businesserp.api.model.*;
import com.businesserp.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

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
    private final com.businesserp.api.service.RealtimeBroadcastService broadcastService;

    @GetMapping
    public ResponseEntity<List<Invoice>> getInvoices(
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role
    ) {
        Long tId = tenantId != null ? tenantId : 1L;
        List<Invoice> result;
        if ("EMPLOYEE".equalsIgnoreCase(role) && userId != null) {
            result = invoiceRepo.findByCreatedByIdOrderByCreatedAtDesc(userId);
        } else {
            result = invoiceRepo.findByTenantIdOrderByCreatedAtDesc(tId);
        }
        // FIX 11: prevent browser/CDN caching of invoice lists — always serve fresh DB data
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CacheControl.noStore().getHeaderValue())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(result);
    }

    // FIX 10: @Transactional ensures invoice + items + stock + customer balance + audit log are atomic.
    // If any step fails, the entire operation is rolled back — no partial saves.
    @Transactional
    @PostMapping
    public ResponseEntity<Invoice> createInvoice(
            @RequestBody Invoice invoice,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Long userId
    ) {
        Long tId = tenantId != null ? tenantId : 1L;
        Long uId = userId != null ? userId : 1L;

        Tenant tenant = tenantRepo.findById(tId)
                .orElseGet(() -> tenantRepo.findAll().stream().findFirst()
                .orElseGet(() -> tenantRepo.save(Tenant.builder()
                        .name("Default ERP Business")
                        .email("admin@erp.com")
                        .phone("9999999999")
                        .address("India")
                        .build())));

        User user = (userId != null ? userRepo.findById(uId).orElse(null) : null);
        if (user == null) {
            user = userRepo.findAll().stream().findFirst()
                    .orElseGet(() -> userRepo.save(User.builder()
                            .username("owner")
                            .email("owner@erp.com")
                            .fullName("ERP Owner")
                            .password("123456789")
                            .role(Role.OWNER)
                            .tenant(tenant)
                            .build()));
        }

        // Clear client-side temporary timestamp ID so JPA auto-generates a primary key via PostgreSQL SERIAL
        invoice.setId(null);

        invoice.setTenant(tenant);
        invoice.setCreatedBy(user);

        if (invoice.getType() == null) {
            invoice.setType(InvoiceType.TAX_INVOICE);
        }
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isEmpty() || invoiceRepo.findByInvoiceNumber(invoice.getInvoiceNumber()).isPresent()) {
            // Sequential numbering: INV-001, INV-002, INV-003...
            long nextNum = invoiceRepo.count() + 1;
            String candidateNumber;
            do {
                candidateNumber = String.format("INV-%03d", nextNum);
                nextNum++;
            } while (invoiceRepo.findByInvoiceNumber(candidateNumber).isPresent());
            invoice.setInvoiceNumber(candidateNumber);
        }

        // Link or auto-create Customer
        if (invoice.getCustomer() != null && invoice.getCustomer().getId() != null) {
            Customer customer = customerRepo.findById(invoice.getCustomer().getId()).orElse(null);
            invoice.setCustomer(customer);
        } else if (invoice.getCustomer() != null && invoice.getCustomer().getName() != null && !invoice.getCustomer().getName().isBlank()) {
            String cName = invoice.getCustomer().getName().trim();
            Customer existing = customerRepo.findByTenantId(tId).stream()
                    .filter(c -> c.getName().equalsIgnoreCase(cName))
                    .findFirst()
                    .orElseGet(() -> customerRepo.save(Customer.builder()
                            .name(cName)
                            .phone(invoice.getCustomer().getPhone() != null ? invoice.getCustomer().getPhone() : "")
                            .address(invoice.getCustomer().getAddress() != null ? invoice.getCustomer().getAddress() : "")
                            .creditLimit(new BigDecimal("10000.00"))
                            .pendingBalance(BigDecimal.ZERO)
                            .tenant(tenant)
                            .build()));
            invoice.setCustomer(existing);
        }

        // Link parent invoice reference on items & adjust stock for TAX_INVOICE
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                item.setId(null); // Clear temporary client-side ID
                item.setInvoice(invoice);

                if (item.getProductName() == null || item.getProductName().isBlank()) {
                    item.setProductName("Item");
                }
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    item.setQuantity(1.0);
                }
                if (item.getUnitPrice() == null) {
                    item.setUnitPrice(BigDecimal.ZERO);
                }
                if (item.getTaxRate() == null) {
                    item.setTaxRate(BigDecimal.ZERO);
                }
                if (item.getTaxAmount() == null) {
                    item.setTaxAmount(BigDecimal.ZERO);
                }
                if (item.getTotalPrice() == null) {
                    BigDecimal qty = BigDecimal.valueOf(item.getQuantity());
                    item.setTotalPrice(item.getUnitPrice().multiply(qty));
                }

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
        }

        // Customer credit/balance update if unpaid / partial
        if (invoice.getCustomer() != null) {
            Customer customer = invoice.getCustomer();
            BigDecimal balanceDue = invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO;
            if (invoice.getType() == InvoiceType.SALES_RETURN) {
                BigDecimal currentBal = customer.getPendingBalance() != null ? customer.getPendingBalance() : BigDecimal.ZERO;
                customer.setPendingBalance(currentBal.subtract(balanceDue).max(BigDecimal.ZERO));
            } else if (invoice.getType() == InvoiceType.TAX_INVOICE && balanceDue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentBal = customer.getPendingBalance() != null ? customer.getPendingBalance() : BigDecimal.ZERO;
                customer.setPendingBalance(currentBal.add(balanceDue));
            }
            customerRepo.save(customer);
        }

        Invoice saved = invoiceRepo.save(invoice);

        try {
            String roleName = (user != null && user.getRole() != null) ? user.getRole().name() : "OWNER";
            String username = (user != null && user.getUsername() != null) ? user.getUsername() : "owner";
            String typeName = (saved.getType() != null) ? saved.getType().name() : "TAX_INVOICE";
            
            auditLogRepo.save(AuditLog.builder()
                    .action("INVOICE_CREATED")
                    .performedByUsername(username)
                    .userRole(roleName)
                    .details("Created " + typeName + " #" + saved.getInvoiceNumber() + " Total: ₹" + saved.getGrandTotal())
                    .tenant(tenant)
                    .build());
        } catch (Exception e) {
            System.err.println("Audit log save warning: " + e.getMessage());
        }

        try {
            broadcastService.broadcast("INVOICE_MUTATED", saved.getId());
        } catch (Exception e) {
            System.err.println("Broadcast warning: " + e.getMessage());
        }

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
        broadcastService.broadcast("INVOICE_MUTATED", invoice.getId());

        return ResponseEntity.ok(java.util.Map.of("message", "Invoice #" + invoice.getInvoiceNumber() + " deleted successfully"));
    }
}
