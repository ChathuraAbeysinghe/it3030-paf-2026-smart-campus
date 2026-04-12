package com.smartcampus.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ResourceType {
    LECTURE_HALL,
    LAB,
    SEMINAR_ROOM,
    AUDITORIUM,
    MEETING_ROOM,
    STUDY_AREA,
    EQUIPMENT;

    @JsonCreator
    public static ResourceType fromValue(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Resource type is required");
        }

        String normalized = raw.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);

        // Backward compatibility for old data like "Hall" or "HALL"
        if ("HALL".equals(normalized) || "LECTUREHALL".equals(normalized)) {
            return LECTURE_HALL;
        }

        try {
            return ResourceType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid resource type: " + raw);
        }
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}