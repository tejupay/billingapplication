package com.businesserp.api;

import com.businesserp.api.model.*;
import com.businesserp.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@SpringBootApplication
@org.springframework.data.jpa.repository.config.EnableJpaRepositories("com.businesserp.api.repository")
@org.springframework.boot.autoconfigure.domain.EntityScan("com.businesserp.api.model")
public class BusinessErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(BusinessErpApplication.class, args);
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner initData(
            TenantRepository tenantRepo,
            UserRepository userRepo,
            CategoryRepository categoryRepo,
            BrandRepository brandRepo,
            ProductRepository productRepo,
            CustomerRepository customerRepo,
            EmployeeRepository employeeRepo,
            ExpenseRepository expenseRepo,
            BCryptPasswordEncoder encoder,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate
    ) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check");
                jdbcTemplate.execute("ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_type_check");
                jdbcTemplate.execute("ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check");
                System.out.println(">>> Database constraints sanitized on startup! <<<");
            } catch (Exception e) {
                System.err.println("Constraint drop warning: " + e.getMessage());
            }

            if (tenantRepo.count() == 0) {
                // 1. Seed Tenant
                Tenant tenant = Tenant.builder()
                        .name("Yashas EV Service")
                        .gstin("29EVHUB1234F1Z5")
                        .phone("+91 7676424061")
                        .email("yrtmotos@gmail.com")
                        .address("1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073")
                        .bankName("Canara Bank")
                        .accountNumber("120001017346")
                        .ifscCode("CNRB0001199")
                        .upiId("8105979580-of5a-2@ybl")
                        .build();
                tenant = tenantRepo.save(tenant);

                // 2. Seed Primary Owner & Admin Accounts
                User admin = User.builder()
                        .username("admin")
                        .email("admin@yashasev.com")
                        .password(encoder.encode("admin123"))
                        .fullName("System Administrator (Owner)")
                        .phone("+91 767642061")
                        .role(Role.OWNER)
                        .tenant(tenant)
                        .active(true)
                        .build();

                User owner = User.builder()
                        .username("tejutejasteju7779@gmail.com")
                        .email("tejutejasteju7779@gmail.com")
                        .password(encoder.encode("123456789"))
                        .fullName("Tejas Y (Owner)")
                        .phone("+91 9876543210")
                        .role(Role.OWNER)
                        .tenant(tenant)
                        .active(true)
                        .build();

                User ownerAlt = User.builder()
                        .username("owner")
                        .email("tejupay@gmail.com")
                        .password(encoder.encode("123456789"))
                        .fullName("Tejas Y (Owner)")
                        .phone("+91 9876543210")
                        .role(Role.OWNER)
                        .tenant(tenant)
                        .active(true)
                        .build();

                userRepo.saveAll(List.of(admin, owner, ownerAlt));

                // 3. Seed Categories & Brands
                Category catElectronics = categoryRepo.save(Category.builder().name("Electronics & Gadgets").tenant(tenant).build());
                Category catGroceries = categoryRepo.save(Category.builder().name("General Supplies").tenant(tenant).build());

                Brand brandSamsung = brandRepo.save(Brand.builder().name("Samsung").tenant(tenant).build());
                Brand brandDell = brandRepo.save(Brand.builder().name("Dell").tenant(tenant).build());

                // 4. Seed Products
                Product p1 = Product.builder()
                        .name("Samsung Smart Monitor 27\"")
                        .barcode("890123456701")
                        .hsnCode("85285200")
                        .purchasePrice(new BigDecimal("12500.00"))
                        .sellingPrice(new BigDecimal("16999.00"))
                        .taxRate(new BigDecimal("18.00"))
                        .stockQuantity(15.0)
                        .minStockThreshold(5.0)
                        .unit("Pcs")
                        .category(catElectronics)
                        .brand(brandSamsung)
                        .tenant(tenant)
                        .build();

                Product p2 = Product.builder()
                        .name("Dell Wireless Keyboard & Mouse Combo")
                        .barcode("890123456702")
                        .hsnCode("84716040")
                        .purchasePrice(new BigDecimal("1100.00"))
                        .sellingPrice(new BigDecimal("1599.00"))
                        .taxRate(new BigDecimal("18.00"))
                        .stockQuantity(3.0) // Low stock alert trigger
                        .minStockThreshold(10.0)
                        .unit("Pcs")
                        .category(catElectronics)
                        .brand(brandDell)
                        .tenant(tenant)
                        .build();

                Product p3 = Product.builder()
                        .name("USB-C Fast Charging Cable 2M")
                        .barcode("890123456703")
                        .hsnCode("85444299")
                        .purchasePrice(new BigDecimal("180.00"))
                        .sellingPrice(new BigDecimal("399.00"))
                        .taxRate(new BigDecimal("18.00"))
                        .stockQuantity(45.0)
                        .minStockThreshold(8.0)
                        .unit("Pcs")
                        .category(catElectronics)
                        .tenant(tenant)
                        .build();

                productRepo.saveAll(List.of(p1, p2, p3));

                // 5. Seed Customers
                Customer c1 = Customer.builder()
                        .name("TechSolutions Pvt Ltd")
                        .phone("+91 9988776655")
                        .email("procurement@techsolutions.com")
                        .gstin("29AAACT1234A1Z5")
                        .address("Plot 42, Electronic City Phase 1, Bengaluru")
                        .creditLimit(new BigDecimal("50000.00"))
                        .pendingBalance(new BigDecimal("14500.00"))
                        .tenant(tenant)
                        .build();

                Customer c2 = Customer.builder()
                        .name("Rahul Mehta (Retail)")
                        .phone("+91 9123456789")
                        .email("rahul.m@gmail.com")
                        .address("Flat 302, Green Valley Apartments, Bengaluru")
                        .creditLimit(new BigDecimal("10000.00"))
                        .pendingBalance(BigDecimal.ZERO)
                        .tenant(tenant)
                        .build();

                customerRepo.saveAll(List.of(c1, c2));

                // 6. Seed Employee & Expenses
                Employee emp1 = Employee.builder()
                        .name("Amit Kumar")
                        .designation("Sales Executive")
                        .phone("+91 9876543212")
                        .email("employee@apexretail.com")
                        .monthlySalary(new BigDecimal("28000.00"))
                        .joiningDate(LocalDate.of(2024, 1, 15))
                        .userAccount(admin)
                        .tenant(tenant)
                        .build();
                employeeRepo.save(emp1);

                Expense exp1 = Expense.builder()
                        .category("Rent & Lease")
                        .amount(new BigDecimal("35000.00"))
                        .description("Commercial Store Monthly Rent")
                        .expenseDate(LocalDate.now().minusDays(5))
                        .tenant(tenant)
                        .build();

                Expense exp2 = Expense.builder()
                        .category("Utilities")
                        .amount(new BigDecimal("4200.00"))
                        .description("Electricity & Broadband Bill")
                        .expenseDate(LocalDate.now().minusDays(2))
                        .tenant(tenant)
                        .build();

                expenseRepo.saveAll(List.of(exp1, exp2));

                System.out.println(">>> Business ERP AI Data Seeding Completed Successfully! <<<");
                System.out.println("Primary Admin Account Created:");
                System.out.println(" - OWNER (Admin) : admin / admin123");
            }

            // Ensure default owner accounts exist and are active
            Tenant primaryTenant = tenantRepo.findAll().stream().findFirst().orElseGet(() -> tenantRepo.save(Tenant.builder()
                    .name("Yashas EV Service")
                    .gstin("29EVHUB1234F1Z5")
                    .phone("+91 7676424061")
                    .email("yrtmotos@gmail.com")
                    .address("1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073")
                    .bankName("Canara Bank")
                    .accountNumber("120001017346")
                    .ifscCode("CNRB0001199")
                    .upiId("8105979580-of5a-2@ybl")
                    .build()));

            String[][] defaultAccounts = {
                    {"owner", "tejupay@gmail.com", "123456789", "Tejas Y (Owner)"},
                    {"tejutejasteju7779@gmail.com", "tejutejasteju7779@gmail.com", "123456789", "Tejas Y (Owner)"},
                    {"admin", "admin@erp.com", "admin123", "Admin"}
            };

            for (String[] acc : defaultAccounts) {
                String uName = acc[0];
                String uEmail = acc[1];
                String uPass = acc[2];
                String uFullName = acc[3];

                User existing = userRepo.findByUsernameIgnoreCase(uName)
                        .orElseGet(() -> userRepo.findByEmailIgnoreCase(uEmail).orElse(null));

                if (existing == null) {
                    userRepo.save(User.builder()
                            .username(uName)
                            .email(uEmail)
                            .password(encoder.encode(uPass))
                            .fullName(uFullName)
                            .phone("+91 9876543210")
                            .role(Role.OWNER)
                            .tenant(primaryTenant)
                            .active(true)
                            .build());
                } else {
                    boolean mod = false;
                    if (!existing.isActive()) {
                        existing.setActive(true);
                        mod = true;
                    }
                    if (existing.getPassword() == null || (!existing.getPassword().startsWith("$2a$") && !existing.getPassword().startsWith("$2b$"))) {
                        existing.setPassword(encoder.encode(uPass));
                        mod = true;
                    }
                    if (mod) {
                        userRepo.save(existing);
                    }
                }
            }

            // Ensure all other user accounts in database are active with valid BCrypt hashed passwords
            List<User> allUsers = userRepo.findAll();
            for (User u : allUsers) {
                boolean modified = false;
                if (!u.isActive()) {
                    u.setActive(true);
                    modified = true;
                }
                if (u.getPassword() != null && !u.getPassword().startsWith("$2a$") && !u.getPassword().startsWith("$2b$")) {
                    u.setPassword(encoder.encode(u.getPassword()));
                    modified = true;
                }
                if (modified) {
                    userRepo.save(u);
                }
            }
        };
    }
}
