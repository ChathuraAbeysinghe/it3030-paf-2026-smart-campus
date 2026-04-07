// backend/src/main/java/com/smartcampus/backend/model/Resource.java
package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

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

    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    private Instant createdAt;
    private Instant updatedAt;
}
