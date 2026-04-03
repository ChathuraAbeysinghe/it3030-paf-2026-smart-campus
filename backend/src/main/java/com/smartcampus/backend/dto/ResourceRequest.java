// backend/src/main/java/com/smartcampus/backend/dto/ResourceRequest.java
package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResourceRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 2000, message = "Capacity is too large")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 120, message = "Location must be at most 120 characters")
    private String location;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotNull(message = "Status is required")
    private ResourceStatus status;
}