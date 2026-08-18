package com.businesserp.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:tejupay@gmail.com}")
    private String fromEmail;

    public boolean sendOtpEmail(String toEmail, String otpCode) {
        String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "tejupay@gmail.com";
        log.info("Attempting to send OTP [{}] from [{}] to recipient [{}]", otpCode, sender, toEmail);
        
        System.out.println("=================================================================");
        System.out.println(">>> GENERATED OTP: " + otpCode + " FOR SPECIFIC RECIPIENT: " + toEmail + " <<<");
        System.out.println("=================================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender);
            message.setTo(toEmail);
            message.setSubject("Your Password Reset OTP Code - Business ERP AI");
            message.setText("Dear User,\n\n" +
                    "Your One-Time Password (OTP) for resetting your Business ERP AI account password is:\n\n" +
                    "   " + otpCode + "\n\n" +
                    "This OTP is valid for 10 minutes. Please enter this code in the ERP application to proceed.\n\n" +
                    "If you did not request this OTP, please ignore this email.\n\n" +
                    "Regards,\n" +
                    "Business ERP AI Support");

            mailSender.send(message);
            log.info("Successfully dispatched OTP email via SMTP to target email: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to deliver OTP email via SMTP to target address [{}]: {}", toEmail, e.getMessage(), e);
            System.err.println("!!! SMTP EMAIL ERROR: Could not send email to " + toEmail + ". Reason: " + e.getMessage());
            return false;
        }
    }
}

