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
                        .name("YASHAS EV SERVICE")
                        .gstin("29EVHUB1234F1Z5")
                        .phone("+91 7676424061")
                        .email("yrtmotos@gmail.com")
                        .address("1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073")
                        .bankName("Karnataka Bank")
                        .accountNumber("0894202500006001")
                        .ifscCode("KARB0000894")
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

                // 3. Seed Categories
                Category catConsumables = categoryRepo.save(Category.builder().name("General Service & Consumables").tenant(tenant).build());
                Category catBrakes = categoryRepo.save(Category.builder().name("Brakes & Wheels").tenant(tenant).build());
                Category catElectrical = categoryRepo.save(Category.builder().name("EV Electrical & Control").tenant(tenant).build());
                Category catMotor = categoryRepo.save(Category.builder().name("Motor & Suspension").tenant(tenant).build());
                Category catBody = categoryRepo.save(Category.builder().name("Body & Accessories").tenant(tenant).build());
                Category catHardware = categoryRepo.save(Category.builder().name("Fasteners & Workshop Parts").tenant(tenant).build());
                Category catServices = categoryRepo.save(Category.builder().name("Workshop Services").tenant(tenant).build());

                // 4. Seed Essential EV Workshop Products
                List<Product> evProducts = List.of(
                        Product.builder().name("Front Brake Pad Set").barcode("890123456011").hsnCode("87141090").purchasePrice(new BigDecimal("180.00")).sellingPrice(new BigDecimal("380.00")).taxRate(new BigDecimal("18.00")).stockQuantity(40.0).minStockThreshold(10.0).unit("Pair/set").category(catBrakes).tenant(tenant).build(),
                        Product.builder().name("Rear Brake Pad Set").barcode("890123456012").hsnCode("87141090").purchasePrice(new BigDecimal("180.00")).sellingPrice(new BigDecimal("380.00")).taxRate(new BigDecimal("18.00")).stockQuantity(40.0).minStockThreshold(10.0).unit("Pair/set").category(catBrakes).tenant(tenant).build(),
                        Product.builder().name("BLDC Motor Controller").barcode("890123456025").hsnCode("85371000").purchasePrice(new BigDecimal("2200.00")).sellingPrice(new BigDecimal("3800.00")).taxRate(new BigDecimal("18.00")).stockQuantity(15.0).minStockThreshold(3.0).unit("Nos").category(catElectrical).tenant(tenant).build(),
                        Product.builder().name("DC-DC Converter").barcode("890123456026").hsnCode("85044090").purchasePrice(new BigDecimal("350.00")).sellingPrice(new BigDecimal("750.00")).taxRate(new BigDecimal("18.00")).stockQuantity(25.0).minStockThreshold(5.0).unit("Nos").category(catElectrical).tenant(tenant).build(),
                        Product.builder().name("Throttle Assembly").barcode("890123456039").hsnCode("87141090").purchasePrice(new BigDecimal("350.00")).sellingPrice(new BigDecimal("700.00")).taxRate(new BigDecimal("18.00")).stockQuantity(30.0).minStockThreshold(6.0).unit("Nos").category(catElectrical).tenant(tenant).build(),
                        Product.builder().name("BLDC Hub Motor").barcode("890123456043").hsnCode("85013119").purchasePrice(new BigDecimal("4500.00")).sellingPrice(new BigDecimal("7500.00")).taxRate(new BigDecimal("18.00")).stockQuantity(8.0).minStockThreshold(2.0).unit("Nos").category(catMotor).tenant(tenant).build(),
                        Product.builder().name("Front Fork Oil Seal").barcode("890123456053").hsnCode("84842000").purchasePrice(new BigDecimal("120.00")).sellingPrice(new BigDecimal("280.00")).taxRate(new BigDecimal("18.00")).stockQuantity(30.0).minStockThreshold(8.0).unit("Set").category(catMotor).tenant(tenant).build(),
                        Product.builder().name("Chain Lubricant").barcode("890123456003").hsnCode("34031900").purchasePrice(new BigDecimal("180.00")).sellingPrice(new BigDecimal("350.00")).taxRate(new BigDecimal("18.00")).stockQuantity(30.0).minStockThreshold(5.0).unit("Bottle").category(catConsumables).tenant(tenant).build(),
                        Product.builder().name("EV Full General Service & Diagnostics").barcode("890123456077").hsnCode("998729").purchasePrice(BigDecimal.ZERO).sellingPrice(new BigDecimal("850.00")).taxRate(new BigDecimal("18.00")).stockQuantity(999.0).minStockThreshold(1.0).unit("Nos").category(catServices).tenant(tenant).build(),
                        Product.builder().name("Brake Service & Overhaul").barcode("890123456078").hsnCode("998729").purchasePrice(BigDecimal.ZERO).sellingPrice(new BigDecimal("350.00")).taxRate(new BigDecimal("18.00")).stockQuantity(999.0).minStockThreshold(1.0).unit("Nos").category(catServices).tenant(tenant).build()
                );

                productRepo.saveAll(evProducts);

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
                    .name("YASHAS EV SERVICE")
                    .gstin("29EVHUB1234F1Z5")
                    .phone("+91 7676424061")
                    .email("yrtmotos@gmail.com")
                    .address("1/9 A.M Complex, Next To Just Bake, Opp to C.B Kallu Metro Station, Bangalore - 560073")
                    .bankName("Karnataka Bank")
                    .accountNumber("0894202500006001")
                    .ifscCode("KARB0000894")
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
