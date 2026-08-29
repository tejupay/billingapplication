package com.businesserp.api.controller;

import com.businesserp.api.config.JwtTokenProvider;
import com.businesserp.api.dto.*;
import com.businesserp.api.model.AuditLog;
import com.businesserp.api.model.PasswordResetOtp;
import com.businesserp.api.model.Role;
import com.businesserp.api.model.User;
import com.businesserp.api.repository.AuditLogRepository;
import com.businesserp.api.repository.PasswordResetOtpRepository;
import com.businesserp.api.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordResetOtpRepository otpRepo;
    private final AuditLogRepository auditLogRepo;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;
    private final com.businesserp.api.service.EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepo.findByUsername(request.getUsername())
                .orElseGet(() -> userRepo.findByEmail(request.getUsername()).orElse(null));

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username/email or password"));
        }

        boolean passwordMatches = false;
        if (user.getPassword() != null) {
            if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
                passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
            } else {
                passwordMatches = request.getPassword().equals(user.getPassword());
                if (passwordMatches) {
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                }
            }
        }

        if (!passwordMatches) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username/email or password"));
        }

        if (!user.isActive()) {
            if (user.getRole() == Role.OWNER) {
                user.setActive(true);
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "Account is deactivated by owner"));
            }
        }

        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);

        // Audit Log
        auditLogRepo.save(AuditLog.builder()
                .action("LOGIN_SUCCESS")
                .performedByUsername(user.getUsername())
                .userRole(user.getRole().name())
                .details("Successful authentication into ERP system")
                .tenant(user.getTenant())
                .build());

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getTenant().getId(), user.getId());

        AuthResponse response = AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .tenantId(user.getTenant().getId())
                .tenantName(user.getTenant().getName())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/request")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        String inputTarget = request.getEmail() != null ? request.getEmail().trim() : "";
        if (inputTarget.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email or username is required to request OTP."));
        }

        // Try to find matching user account by email or username (case-insensitive)
        User user = userRepo.findByEmailIgnoreCase(inputTarget)
                .orElseGet(() -> userRepo.findByUsernameIgnoreCase(inputTarget).orElse(null));

        String targetEmail;
        if (inputTarget.contains("@")) {
            // User explicitly requested OTP to a specific email address
            targetEmail = inputTarget;
        } else if (user != null && user.getEmail() != null && user.getEmail().contains("@")) {
            // User entered username, fallback to user's registered email
            targetEmail = user.getEmail();
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "No valid email address found for user: " + inputTarget));
        }

        // Generate 6-digit secure numeric OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(900000) + 100000);

        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(targetEmail)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        otpRepo.save(resetOtp);

        // Send OTP directly to the target email
        boolean emailSent = emailService.sendOtpEmail(targetEmail, otp);

        if (user != null) {
            auditLogRepo.save(AuditLog.builder()
                    .action("OTP_REQUESTED")
                    .performedByUsername(user.getUsername())
                    .userRole(user.getRole().name())
                    .details("Password reset OTP generated for target email: " + targetEmail + " (Email sent: " + emailSent + ")")
                    .tenant(user.getTenant())
                    .build());
        }

        return ResponseEntity.ok(Map.of(
                "message", emailSent
                        ? "OTP sent successfully to " + targetEmail + "! Please check your Gmail inbox and Spam folder."
                        : "OTP generated for " + targetEmail + ". (If email delivery fails, check backend logs for OTP: " + otp + ")",
                "email", targetEmail,
                "emailSent", emailSent,
                "expiresInMinutes", 10,
                "otpCode", emailSent ? "" : otp // provided as fallback in response if SMTP fails in local environment
        ));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String targetInput = request.getEmail() != null ? request.getEmail().trim() : "";
        String inputOtp = request.getOtp() != null ? request.getOtp().trim() : "";

        // Find user by email or username
        User user = userRepo.findByEmailIgnoreCase(targetInput)
                .orElseGet(() -> userRepo.findByUsernameIgnoreCase(targetInput).orElse(null));

        // Find OTP record by email or user's email
        PasswordResetOtp otpRecord = otpRepo.findByEmailIgnoreCaseAndOtpAndUsedFalse(targetInput, inputOtp)
                .orElseGet(() -> {
                    if (user != null && user.getEmail() != null) {
                        return otpRepo.findByEmailIgnoreCaseAndOtpAndUsedFalse(user.getEmail(), inputOtp).orElse(null);
                    }
                    return null;
                });

        if (otpRecord == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or already used OTP code. Please check the 6-digit code and try again."));
        }

        if (otpRecord.getExpiryTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP code has expired (valid for 10 minutes). Please request a new OTP."));
        }

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No user account associated with email: " + targetInput));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        otpRecord.setUsed(true);
        otpRepo.save(otpRecord);

        auditLogRepo.save(AuditLog.builder()
                .action("PASSWORD_RESET_SUCCESS")
                .performedByUsername(user.getUsername())
                .userRole(user.getRole().name())
                .details("Password successfully updated using OTP verification for email: " + targetInput)
                .tenant(user.getTenant())
                .build());

        return ResponseEntity.ok(Map.of("message", "Password reset successful! You can now log in with your new password."));
    }
}
