package com.businesserp.api.repository;

import com.businesserp.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByTenantId(Long tenantId);
    Optional<Product> findByBarcodeAndTenantId(String barcode, Long tenantId);
    
    @Query("SELECT p FROM Product p WHERE p.tenant.id = :tenantId AND p.stockQuantity <= p.minStockThreshold")
    List<Product> findLowStockProducts(@Param("tenantId") Long tenantId);
    
    @Query("SELECT p FROM Product p WHERE p.tenant.id = :tenantId AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.barcode) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("tenantId") Long tenantId, @Param("query") String query);
}
