package com.smartcampus.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ResourceStatus {
    ACTIVE,
    OUT_OF_SERVICE;

    @JsonCreator
    public static ResourceStatus fromValue(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Resource status is required");
        }

        String normalized = raw.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);

        try {
            return ResourceStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid resource status: " + raw);
        }
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}