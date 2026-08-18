package com.businesserp.api.repository;

import com.businesserp.api.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByTenantId(Long tenantId);
    List<Customer> findByNameContainingIgnoreCaseAndTenantId(String name, Long tenantId);
}
