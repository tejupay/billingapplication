package com.businesserp.api.controller;

import com.businesserp.api.model.Customer;
import com.businesserp.api.model.Product;
import com.businesserp.api.repository.CustomerRepository;
import com.businesserp.api.repository.ExpenseRepository;
import com.businesserp.api.repository.InvoiceRepository;
import com.businesserp.api.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final InvoiceRepository invoiceRepo;
    private final ExpenseRepository expenseRepo;
    private final ProductRepository productRepo;
    private final CustomerRepository customerRepo;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String role
    ) {
        Map<String, Object> summary = new HashMap<>();

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal totalSales = invoiceRepo.sumGrandTotalByTenantAndStartDate(tenantId, startOfMonth);
        if (totalSales == null) totalSales = BigDecimal.ZERO;

        BigDecimal totalExpenses = expenseRepo.sumAmountByTenantAndStartDate(tenantId, LocalDate.now().withDayOfMonth(1));
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        BigDecimal netProfit = totalSales.subtract(totalExpenses);

        List<Product> lowStock = productRepo.findLowStockProducts(tenantId);
        List<Customer> customers = customerRepo.findByTenantId(tenantId);

        BigDecimal pendingDues = customers.stream()
                .map(c -> c.getPendingBalance() != null ? c.getPendingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        summary.put("monthlySales", totalSales);
        summary.put("monthlyExpenses", totalExpenses);
        summary.put("netProfit", netProfit);
        summary.put("lowStockCount", lowStock.size());
        summary.put("lowStockProducts", lowStock);
        summary.put("pendingCustomerDues", pendingDues);

        if ("EMPLOYEE".equalsIgnoreCase(role) && userId != null) {
            BigDecimal empSales = invoiceRepo.sumGrandTotalByUserAndStartDate(userId, startOfMonth);
            summary.put("employeeMonthlySales", empSales != null ? empSales : BigDecimal.ZERO);
        }

        return ResponseEntity.ok(summary);
    }
}
