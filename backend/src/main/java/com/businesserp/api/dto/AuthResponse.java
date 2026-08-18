package com.businesserp.api.dto;

import com.businesserp.api.model.Role;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String username;
    private String fullName;
    private String email;
    private Role role;
    private Long tenantId;
    private String tenantName;
}
