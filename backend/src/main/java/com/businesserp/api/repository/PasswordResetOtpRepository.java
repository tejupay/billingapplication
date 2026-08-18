package com.businesserp.api.repository;

import com.businesserp.api.model.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findByEmailAndOtpAndUsedFalse(String email, String otp);
    Optional<PasswordResetOtp> findByEmailIgnoreCaseAndOtpAndUsedFalse(String email, String otp);
}

