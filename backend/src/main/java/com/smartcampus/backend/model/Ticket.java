package com.smartcampus.backend.model;

import com.smartcampus.backend.model.enums.SlaStatus;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
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
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String ticketId;          // Human-readable ID: T-001, T-002, ...
    private String title;
    private String description;

    private TicketCategory category;
    private TicketPriority priority;

    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    private String location;
    private String resourceId;        // ref → Resource collection

    private String createdBy;         // userId
    private String createdByName;
    private String assignedTechnician; // userId (nullable)
    private String assignedTechnicianName;

    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @Builder.Default
    private List<Attachment> resolutionAttachments = new ArrayList<>();

    // ── SLA fields ──
    private Instant slaDeadline;
    private Instant slaPausedAt;

    @Builder.Default
    private long totalPausedDuration = 0;   // seconds

    @Builder.Default
    private SlaStatus slaStatus = SlaStatus.WITHIN_SLA;

    // ── Status-specific notes ──
    private String rejectionReason;
    private String onHoldReason;
    private String resolutionNote;
    private String disputeNote;

    // ── Timestamps ──
    private Instant userConfirmedAt;
    private Instant resolvedAt;
    private Instant closedAt;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private boolean viewedByAdmin = false;

    @Builder.Default
    private int reopenCount = 0;

    private Instant createdAt;
    private Instant updatedAt;

    // ── Embedded attachment class ──
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String url;
        private String filename;
        private Instant uploadedAt;
    }
}
