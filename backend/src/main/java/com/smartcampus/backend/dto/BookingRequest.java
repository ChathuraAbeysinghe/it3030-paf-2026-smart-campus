package com.smartcampus.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {

    @NotBlank(message = "Facility ID is required")
    private String facilityId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500, message = "Purpose must be at most 500 characters")
    private String purpose;

    @NotNull(message = "Attendees is required")
    @Min(value = 1, message = "Attendees must be at least 1")
    @JsonAlias("expectedAttendees")
    private Integer attendees;
}
