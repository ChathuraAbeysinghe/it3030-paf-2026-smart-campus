package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    private String reason;          // Required for REJECTED / ON_HOLD
    private String resolutionNote;  // For WAITING_USER_CONFIRMATION
}
