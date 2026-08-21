package com.businesserp.api.controller;

import com.businesserp.api.model.Customer;
import com.businesserp.api.model.Tenant;
import com.businesserp.api.repository.CustomerRepository;
import com.businesserp.api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepo;
    private final TenantRepository tenantRepo;
    private final com.businesserp.api.service.RealtimeBroadcastService broadcastService;

    @GetMapping
    public ResponseEntity<List<Customer>> getCustomers(@RequestParam(required = false) Long tenantId, @RequestParam(required = false) String search) {
        Long tId = tenantId != null ? tenantId : 1L;
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(customerRepo.findByNameContainingIgnoreCaseAndTenantId(search.trim(), tId));
        }
        return ResponseEntity.ok(customerRepo.findByTenantId(tId));
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer, @RequestParam(required = false) Long tenantId) {
        Long tId = tenantId != null ? tenantId : 1L;
        Tenant tenant = tenantRepo.findById(tId)
                .orElseGet(() -> tenantRepo.findAll().stream().findFirst().orElseThrow(() -> new RuntimeException("Tenant not found")));
        customer.setTenant(tenant);
        Customer saved = customerRepo.save(customer);
        broadcastService.broadcast("CUSTOMER_MUTATED", saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<Customer> recordPayment(@PathVariable Long id, @RequestParam BigDecimal paymentAmount) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal current = customer.getPendingBalance() != null ? customer.getPendingBalance() : BigDecimal.ZERO;
        customer.setPendingBalance(current.subtract(paymentAmount).max(BigDecimal.ZERO));
        Customer saved = customerRepo.save(customer);
        broadcastService.broadcast("CUSTOMER_MUTATED", saved);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customerRepo.delete(customer);
        return ResponseEntity.ok(java.util.Map.of("message", "Customer profile deleted successfully"));
    }
}
