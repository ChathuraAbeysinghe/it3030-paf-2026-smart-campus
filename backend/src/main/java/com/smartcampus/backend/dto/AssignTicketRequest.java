package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignTicketRequest {

    @NotBlank(message = "Technician ID is required")
    private String technicianId;
}
