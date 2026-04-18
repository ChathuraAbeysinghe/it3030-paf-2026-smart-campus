package com.smartcampus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentRequest {
    @NotBlank(message = "Message cannot be blank")
    private String message;

    private String messageType = "TEXT";
}
