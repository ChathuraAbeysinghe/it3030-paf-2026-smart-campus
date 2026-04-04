package com.smartcampus.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED;

    @JsonCreator
    public static BookingStatus fromValue(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Booking status is required");
        }

        String normalized = raw.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);

        try {
            return BookingStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid booking status: " + raw);
        }
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
