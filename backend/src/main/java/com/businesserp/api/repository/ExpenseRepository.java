package com.businesserp.api.repository;

import com.businesserp.api.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTenantIdOrderByExpenseDateDesc(Long tenantId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.tenant.id = :tenantId AND e.expenseDate >= :startDate")
    BigDecimal sumAmountByTenantAndStartDate(@Param("tenantId") Long tenantId, @Param("startDate") LocalDate startDate);
}
