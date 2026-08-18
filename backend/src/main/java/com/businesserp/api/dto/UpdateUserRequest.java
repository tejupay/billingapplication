package com.businesserp.api.dto;

import com.businesserp.api.model.Role;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String username;
    private String email;
    private String password;
    private Role role;
}
