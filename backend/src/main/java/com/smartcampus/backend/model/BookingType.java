package com.smartcampus.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * BOOKING = attendees >= 60% of capacity  → normal booking flow
 * REQUEST = attendees <  60% of capacity  → flagged as a low-occupancy request
 */
public enum BookingType {
    BOOKING,
    REQUEST;

    @JsonCreator
    public static BookingType fromValue(String raw) {
        if (raw == null) return BOOKING; // default
        try {
            return BookingType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return BOOKING;
        }
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}