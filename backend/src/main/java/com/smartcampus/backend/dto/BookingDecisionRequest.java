package com.smartcampus.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BookingDecisionRequest {

    @Size(max = 500, message = "Admin notes must be at most 500 characters")
    private String adminNotes;
}
