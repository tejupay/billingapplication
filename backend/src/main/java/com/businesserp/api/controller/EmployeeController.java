package com.businesserp.api.controller;

import com.businesserp.api.model.Employee;
import com.businesserp.api.model.Tenant;
import com.businesserp.api.repository.EmployeeRepository;
import com.businesserp.api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeRepository employeeRepo;
    private final TenantRepository tenantRepo;

    @GetMapping
    public ResponseEntity<List<Employee>> getEmployees(@RequestParam Long tenantId) {
        return ResponseEntity.ok(employeeRepo.findByTenantId(tenantId));
    }

    @PostMapping
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee, @RequestParam Long tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        employee.setTenant(tenant);
        return ResponseEntity.ok(employeeRepo.save(employee));
    }
}

