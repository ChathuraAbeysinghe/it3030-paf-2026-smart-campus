package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^(?i)([A-Z]{2}\\d{8}@my\\.sliit\\.lk|[a-z0-9._%+\\-]+@sliit\\.lk)$",
        message = "Use a valid SLIIT email (@my.sliit.lk for students or @sliit.lk for staff)"
    )
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
