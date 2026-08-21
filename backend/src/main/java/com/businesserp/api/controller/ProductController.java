package com.businesserp.api.controller;

import com.businesserp.api.model.AuditLog;
import com.businesserp.api.model.Product;
import com.businesserp.api.model.Tenant;
import com.businesserp.api.repository.AuditLogRepository;
import com.businesserp.api.repository.ProductRepository;
import com.businesserp.api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepo;
    private final TenantRepository tenantRepo;
    private final AuditLogRepository auditLogRepo;
    private final com.businesserp.api.service.RealtimeBroadcastService broadcastService;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(@RequestParam(required = false) Long tenantId, @RequestParam(required = false) String search) {
        Long tId = tenantId != null ? tenantId : 1L;
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(productRepo.searchProducts(tId, search.trim()));
        }
        return ResponseEntity.ok(productRepo.findByTenantId(tId));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(@RequestParam Long tenantId) {
        return ResponseEntity.ok(productRepo.findLowStockProducts(tenantId));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<Product> getByBarcode(@PathVariable String barcode, @RequestParam Long tenantId) {
        return productRepo.findByBarcodeAndTenantId(barcode, tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product, @RequestParam Long tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        product.setTenant(tenant);

        if (product.getPurchasePrice() == null) {
            product.setPurchasePrice(java.math.BigDecimal.ZERO);
        }

        Product saved = productRepo.save(product);

        auditLogRepo.save(AuditLog.builder()
                .action("PRODUCT_CREATED")
                .details("Added product: " + saved.getName() + ", Stock: " + saved.getStockQuantity())
                .tenant(tenant)
                .build());

        broadcastService.broadcast("PRODUCT_MUTATED", saved);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        productRepo.delete(product);

        auditLogRepo.save(AuditLog.builder()
                .action("PRODUCT_DELETED")
                .details("Deleted inventory product: " + product.getName())
                .tenant(product.getTenant())
                .build());

        broadcastService.broadcast("PRODUCT_MUTATED", id);

        return ResponseEntity.ok(java.util.Map.of("message", "Product deleted successfully"));
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> adjustStock(@PathVariable Long id, @RequestParam Double quantity, @RequestParam String mode) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if ("IN".equalsIgnoreCase(mode)) {
            product.setStockQuantity(product.getStockQuantity() + quantity);
        } else if ("OUT".equalsIgnoreCase(mode)) {
            product.setStockQuantity(Math.max(0, product.getStockQuantity() - quantity));
        }

        Product saved = productRepo.save(product);

        auditLogRepo.save(AuditLog.builder()
                .action("STOCK_ADJUSTED")
                .details("Stock " + mode + " by " + quantity + " for " + saved.getName() + ". New stock: " + saved.getStockQuantity())
                .tenant(saved.getTenant())
                .build());

        broadcastService.broadcast("PRODUCT_MUTATED", saved);

        return ResponseEntity.ok(saved);
    }
}
