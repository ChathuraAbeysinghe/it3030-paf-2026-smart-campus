package com.smartcampus.backend.model;

import com.smartcampus.backend.model.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "ticket_timeline")
public class TicketTimeline {

    @Id
    private String id;

    private String ticketId;
    private EventType eventType;

    private String actorId;
    private String actorName;
    private String actorRole;       // ADMIN, TECHNICIAN, USER, SYSTEM

    private String description;

    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    private Instant timestamp;
}
