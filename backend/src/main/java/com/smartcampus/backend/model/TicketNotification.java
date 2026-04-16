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
@Document(collection = "ticket_notifications")
public class TicketNotification {

    @Id
    private String id;

    private String recipientId;
    private String type;            // TICKET_CREATED, TICKET_ASSIGNED, STATUS_UPDATED, etc.
    private String title;
    private String message;
    private String relatedTicketId;

    @Builder.Default
    private boolean isRead = false;

    private Instant createdAt;
}
