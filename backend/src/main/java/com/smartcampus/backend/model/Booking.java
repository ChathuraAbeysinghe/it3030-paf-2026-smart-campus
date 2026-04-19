package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String facilityId;
    private String userId;

    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    private String purpose;
    private Integer expectedAttendees;

    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Builder.Default
    private BookingType bookingType = BookingType.BOOKING;

    private String adminNotes;
    private String qrCode;

    // ── Check-in fields ──────────────────────────────────────────
    @Builder.Default
    private Boolean checkedIn = false;   // true once QR scanned

    private Instant checkedInAt;         // timestamp of check-in
    private String  checkedInBy;         // admin userId who scanned

    // ── Auto-cancel tracking ─────────────────────────────────────
    @Builder.Default
    private boolean autoCancelled = false; // set by scheduler

    private Instant createdAt;
    private Instant updatedAt;
}