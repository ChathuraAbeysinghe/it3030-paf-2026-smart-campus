package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "IT Number is required")
    @Pattern(
        regexp = "^(?i)[A-Z]{2}\\d{8}$",
        message = "ID must be in format AB12345678"
    )
    private String itNumber;

    @NotBlank(message = "Faculty is required")
    private String faculty;

    @NotBlank(message = "Email is required")
    @Pattern(
        regexp = "^(?i)[A-Z]{2}\\d{8}@my\\.sliit\\.lk$",
        message = "Only SLIIT campus emails are allowed (AB********@my.sliit.lk)"
    )
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Pattern(
        regexp = ".*\\d.*",
        message = "Password must contain at least one number"
    )
    private String password;
}
