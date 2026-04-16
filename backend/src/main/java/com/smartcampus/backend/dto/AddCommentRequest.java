package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddCommentRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private String messageType;  // TEXT (default), RESOLUTION_NOTE, DISPUTE_NOTE
}
