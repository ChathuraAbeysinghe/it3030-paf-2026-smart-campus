package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DisputeRequest {

    @NotBlank(message = "Dispute note is required")
    private String disputeNote;
}
