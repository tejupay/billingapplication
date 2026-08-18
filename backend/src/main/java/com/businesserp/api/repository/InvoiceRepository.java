package com.businesserp.api.repository;

import com.businesserp.api.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    List<Invoice> findByCreatedByIdOrderByCreatedAtDesc(Long createdById);
    
    @Query("SELECT SUM(i.grandTotal) FROM Invoice i WHERE i.tenant.id = :tenantId AND i.createdAt >= :startDate")
    BigDecimal sumGrandTotalByTenantAndStartDate(@Param("tenantId") Long tenantId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT SUM(i.grandTotal) FROM Invoice i WHERE i.createdBy.id = :userId AND i.createdAt >= :startDate")
    BigDecimal sumGrandTotalByUserAndStartDate(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
}
