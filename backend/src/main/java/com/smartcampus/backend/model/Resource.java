package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String description;

    // Daily available time window for this resource (HH:mm)
    private String availableFrom;
    private String availableTo;

    private String buildingName;
    private String block;
    private Integer floor;
    private Integer hallNumber;
    private String hallId;

    @Builder.Default
    private List<String> facilities = new ArrayList<>();

    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    private Instant createdAt;
    private Instant updatedAt;
}