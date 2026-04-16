package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

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

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotBlank(message = "Available from time is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Available from must be HH:mm")
    private String availableFrom;

    @NotBlank(message = "Available to time is required")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Available to must be HH:mm")
    private String availableTo;

    @NotBlank(message = "Building is required")
    @Pattern(regexp = "^(MAIN|NEW)$", message = "Building must be MAIN or NEW")
    private String buildingName;

    @NotBlank(message = "Block is required")
    @Pattern(regexp = "^[A-Z]$", message = "Block must be a single letter")
    private String block;

    @NotNull(message = "Floor is required")
    @Min(value = 0, message = "Floor must be 0 or greater")
    @Max(value = 99, message = "Floor is too large")
    private Integer floor;

    @NotNull(message = "Hall number is required")
    @Min(value = 1, message = "Hall number must be at least 1")
    @Max(value = 999, message = "Hall number is too large")
    private Integer hallNumber;

    private List<String> facilities;

    @NotNull(message = "Status is required")
    private ResourceStatus status;
}