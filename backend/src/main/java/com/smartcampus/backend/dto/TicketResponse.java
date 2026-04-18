package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.enums.SlaStatus;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {

    private String id;
    private String ticketId;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String location;
    private String resourceId;

    private String createdBy;
    private String createdByName;
    private String assignedTechnician;
    private String assignedTechnicianName;

    private List<Ticket.Attachment> attachments;
    private List<Ticket.Attachment> resolutionAttachments;

    // SLA
    private Instant slaDeadline;
    private String slaStatus;
    private long totalPausedDuration;

    // Notes
    private String rejectionReason;
    private String onHoldReason;
    private String resolutionNote;
    private String disputeNote;

    // Timestamps
    private Instant userConfirmedAt;
    private Instant resolvedAt;
    private Instant closedAt;
    private Instant createdAt;
    private Instant updatedAt;

    private List<String> tags;
    private boolean viewedByAdmin;
    private int reopenCount;

    // Recurring issue flag (computed)
    private boolean recurringIssue;
    private int similarTicketCount;

    public static TicketResponse from(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketId(ticket.getTicketId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory() != null ? ticket.getCategory().name() : null)
                .priority(ticket.getPriority() != null ? ticket.getPriority().name() : null)
                .status(ticket.getStatus() != null ? ticket.getStatus().name() : null)
                .location(ticket.getLocation())
                .resourceId(ticket.getResourceId())
                .createdBy(ticket.getCreatedBy())
                .createdByName(ticket.getCreatedByName())
                .assignedTechnician(ticket.getAssignedTechnician())
                .assignedTechnicianName(ticket.getAssignedTechnicianName())
                .attachments(ticket.getAttachments())
                .resolutionAttachments(ticket.getResolutionAttachments())
                .slaDeadline(ticket.getSlaDeadline())
                .slaStatus(ticket.getSlaStatus() != null ? ticket.getSlaStatus().name() : null)
                .totalPausedDuration(ticket.getTotalPausedDuration())
                .rejectionReason(ticket.getRejectionReason())
                .onHoldReason(ticket.getOnHoldReason())
                .resolutionNote(ticket.getResolutionNote())
                .disputeNote(ticket.getDisputeNote())
                .userConfirmedAt(ticket.getUserConfirmedAt())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .tags(ticket.getTags())
                .viewedByAdmin(ticket.isViewedByAdmin())
                .reopenCount(ticket.getReopenCount())
                .build();
    }
}
