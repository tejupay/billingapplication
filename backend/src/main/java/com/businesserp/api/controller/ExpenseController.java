package com.businesserp.api.controller;

import com.businesserp.api.model.Expense;
import com.businesserp.api.model.Tenant;
import com.businesserp.api.repository.ExpenseRepository;
import com.businesserp.api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseRepository expenseRepo;
    private final TenantRepository tenantRepo;

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses(@RequestParam Long tenantId) {
        return ResponseEntity.ok(expenseRepo.findByTenantIdOrderByExpenseDateDesc(tenantId));
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense, @RequestParam Long tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        expense.setTenant(tenant);
        return ResponseEntity.ok(expenseRepo.save(expense));
    }
}
