package com.smartcampus.backend.model;

import com.smartcampus.backend.model.enums.MessageType;
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
@Document(collection = "ticket_comments")
public class TicketComment {

    @Id
    private String id;

    private String ticketId;
    private String senderId;
    private String senderName;
    private String senderRole;      // USER, ADMIN, TECHNICIAN, SYSTEM

    private String message;

    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Builder.Default
    private boolean isEdited = false;

    private Instant editedAt;

    @Builder.Default
    private boolean isDeleted = false;

    @Builder.Default
    private List<Ticket.Attachment> attachments = new ArrayList<>();

    private Instant timestamp;
}
