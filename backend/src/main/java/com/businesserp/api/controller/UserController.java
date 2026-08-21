package com.businesserp.api.controller;

import com.businesserp.api.dto.CreateUserRequest;
import com.businesserp.api.dto.UpdateUserRequest;
import com.businesserp.api.model.*;
import com.businesserp.api.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final AuditLogRepository auditLogRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final com.businesserp.api.service.RealtimeBroadcastService broadcastService;

    @GetMapping
    public ResponseEntity<List<User>> getTenantUsers(@RequestParam(required = false) Long tenantId) {
        Long tId = tenantId != null ? tenantId : 1L;
        return ResponseEntity.ok(userRepo.findByTenantId(tId));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request, @RequestParam(required = false) Long tenantId) {
        Long tId = tenantId != null ? tenantId : 1L;
        if (userRepo.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        if (userRepo.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address already registered"));
        }
        if (request.getRole() == Role.OWNER) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot create another Owner account via API"));
        }

        Tenant tenant = tenantRepo.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .tenant(tenant)
                .active(true)
                .build();

        User savedUser = userRepo.save(newUser);

        auditLogRepo.save(AuditLog.builder()
                .action("USER_CREATED")
                .performedByUsername("OWNER")
                .userRole("OWNER")
                .details("Created new staff account: " + savedUser.getUsername() + " (" + savedUser.getRole() + ")")
                .tenant(tenant)
                .build());

        broadcastService.broadcast("USER_MUTATED", savedUser);

        return ResponseEntity.ok(savedUser);
    }

    @PatchMapping("/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.OWNER) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot deactivate Owner account"));
        }

        user.setActive(!user.isActive());
        User updated = userRepo.save(user);

        broadcastService.broadcast("USER_MUTATED", updated);

        return ResponseEntity.ok(Map.of(
                "message", "User status updated successfully",
                "active", user.isActive()
        ));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!user.getUsername().equalsIgnoreCase(request.getUsername()) && userRepo.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already in use"));
            }
            user.setUsername(request.getUsername());
        }
        if (request.getRole() != null && user.getRole() != Role.OWNER) {
            user.setRole(request.getRole());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepo.save(user);

        auditLogRepo.save(AuditLog.builder()
                .action("USER_UPDATED")
                .performedByUsername("OWNER")
                .userRole("OWNER")
                .details("Updated account details for user ID: " + userId + " (" + updatedUser.getUsername() + ")")
                .tenant(user.getTenant())
                .build());

        broadcastService.broadcast("USER_MUTATED", updatedUser);

        return ResponseEntity.ok(updatedUser);
    }
}

