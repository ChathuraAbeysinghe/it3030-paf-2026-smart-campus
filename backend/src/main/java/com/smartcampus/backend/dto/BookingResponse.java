package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.BookingType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class BookingResponse {
    private String id;

    private String facilityId;
    private String facilityName;
    private Integer facilityCapacity;
    private Integer minimumAttendeesRequired;

    private String userId;
    private String userName;

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    private String purpose;
    private Integer expectedAttendees;

    private BookingStatus status;
    private BookingType bookingType;
    private String adminNotes;

    private String qrCode;

    private Instant createdAt;
    private Instant updatedAt;
}