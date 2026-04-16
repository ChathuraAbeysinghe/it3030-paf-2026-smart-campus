package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.exception.InvalidStatusTransitionException;
import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.*;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final SlaService slaService;
    private final TicketTimelineService timelineService;
    private final TicketNotificationService notificationService;
    private final TicketCommentService commentService;

    // ── Valid state transitions (state machine) ──
    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = Map.of(
        TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED, TicketStatus.ON_HOLD),
        TicketStatus.IN_PROGRESS, Set.of(TicketStatus.WAITING_USER_CONFIRMATION, TicketStatus.ON_HOLD, TicketStatus.REJECTED),
        TicketStatus.WAITING_USER_CONFIRMATION, Set.of(TicketStatus.RESOLVED, TicketStatus.IN_PROGRESS),
        TicketStatus.ON_HOLD, Set.of(TicketStatus.IN_PROGRESS),
        TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED),
        TicketStatus.REJECTED, Set.of(),
        TicketStatus.CLOSED, Set.of()
    );

    // ── CREATE ──

    public TicketResponse createTicket(User actor, CreateTicketRequest request) {
        // Generate human-readable ticket ID
        long count = ticketRepository.count();
        String ticketId = String.format("T-%03d", count + 1);

        TicketCategory category = TicketCategory.valueOf(request.getCategory());
        TicketPriority priority = TicketPriority.valueOf(request.getPriority());

        Instant now = Instant.now();
        Instant slaDeadline = slaService.calculateDeadline(priority, now);

        Ticket ticket = Ticket.builder()
                .ticketId(ticketId)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .priority(priority)
                .status(TicketStatus.OPEN)
                .location(request.getLocation())
                .resourceId(request.getResourceId())
                .createdBy(actor.getId())
                .createdByName(actor.getName())
                .slaDeadline(slaDeadline)
                .slaStatus(SlaStatus.WITHIN_SLA)
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .createdAt(now)
                .updatedAt(now)
                .build();

        Ticket saved = ticketRepository.save(ticket);

        // Record timeline event
        timelineService.record(saved.getId(), actor.getId(), actor.getName(),
                actor.getRole().name(), EventType.CREATED,
                "Ticket created by " + actor.getName(),
                Map.of("ticketId", ticketId, "priority", priority.name()));

        // System comment
        commentService.addSystemComment(saved.getId(),
                "Ticket " + ticketId + " created by " + actor.getName());

        // Check for recurring issues
        TicketResponse response = TicketResponse.from(saved);
        if (request.getResourceId() != null) {
            Instant thirtyDaysAgo = now.minus(30, java.time.temporal.ChronoUnit.DAYS);
            List<Ticket> similar = ticketRepository.findByResourceIdAndCategoryAndCreatedAtAfter(
                    request.getResourceId(), category, thirtyDaysAgo);
            if (similar.size() >= 3) {
                response.setRecurringIssue(true);
                response.setSimilarTicketCount(similar.size());
            }
        }

        return response;
    }

    // ── UPDATE STATUS ──

    public TicketResponse updateStatus(String ticketId, User actor, UpdateStatusRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);
        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus());
        TicketStatus oldStatus = ticket.getStatus();

        // Validate transition
        validateTransition(oldStatus, newStatus);

        // Handle specific transitions
        if (newStatus == TicketStatus.REJECTED) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Rejection reason is required");
            }
            ticket.setRejectionReason(request.getReason());
        }

        if (newStatus == TicketStatus.ON_HOLD) {
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "ON_HOLD reason is required");
            }
            ticket.setOnHoldReason(request.getReason());
            slaService.pauseSla(ticket);
        }

        if (oldStatus == TicketStatus.ON_HOLD && newStatus == TicketStatus.IN_PROGRESS) {
            slaService.resumeSla(ticket);
        }

        if (newStatus == TicketStatus.WAITING_USER_CONFIRMATION) {
            ticket.setResolutionNote(request.getResolutionNote());
            ticket.setResolvedAt(Instant.now());
        }

        if (newStatus == TicketStatus.CLOSED) {
            ticket.setClosedAt(Instant.now());
        }

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(Instant.now());

        // Update SLA status
        ticket.setSlaStatus(slaService.evaluateSla(ticket));

        Ticket saved = ticketRepository.save(ticket);

        // Timeline + system comment
        String desc = "Status changed from " + oldStatus + " to " + newStatus + " by " + actor.getName();
        timelineService.record(saved.getId(), actor.getId(), actor.getName(),
                actor.getRole().name(), EventType.STATUS_CHANGED, desc,
                Map.of("fromStatus", oldStatus.name(), "toStatus", newStatus.name()));

        commentService.addSystemComment(saved.getId(), "⚙ " + desc);

        // Notify relevant parties
        if (saved.getCreatedBy() != null && !saved.getCreatedBy().equals(actor.getId())) {
            notificationService.notify(saved.getCreatedBy(), "STATUS_UPDATED",
                    "Ticket " + saved.getTicketId() + " status updated",
                    "Status changed to " + newStatus, saved.getId());
        }
        if (saved.getAssignedTechnician() != null && !saved.getAssignedTechnician().equals(actor.getId())) {
            notificationService.notify(saved.getAssignedTechnician(), "STATUS_UPDATED",
                    "Ticket " + saved.getTicketId() + " status updated",
                    "Status changed to " + newStatus, saved.getId());
        }

        return TicketResponse.from(saved);
    }

    // ── ASSIGN TECHNICIAN ──

    public TicketResponse assignTechnician(String ticketId, User actor, AssignTicketRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technician not found"));

        ticket.setAssignedTechnician(technician.getId());
        ticket.setAssignedTechnicianName(technician.getName());

        // Auto-transition to IN_PROGRESS if still OPEN
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        ticket.setUpdatedAt(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        // Timeline
        timelineService.record(saved.getId(), actor.getId(), actor.getName(),
                actor.getRole().name(), EventType.ASSIGNED,
                "Assigned to " + technician.getName() + " by " + actor.getName(),
                Map.of("technicianId", technician.getId(), "technicianName", technician.getName()));

        commentService.addSystemComment(saved.getId(),
                "🔧 Assigned to " + technician.getName() + " by " + actor.getName());

        // Notify technician
        notificationService.notify(technician.getId(), "TICKET_ASSIGNED",
                "Ticket " + saved.getTicketId() + " assigned to you",
                "You have been assigned to: " + saved.getTitle(), saved.getId());

        // Notify creator
        if (saved.getCreatedBy() != null) {
            notificationService.notify(saved.getCreatedBy(), "TICKET_ASSIGNED",
                    "Ticket " + saved.getTicketId() + " — technician assigned",
                    technician.getName() + " has been assigned to your ticket", saved.getId());
        }

        return TicketResponse.from(saved);
    }

    // ── CONFIRM RESOLUTION ──

    public TicketResponse confirmResolution(String ticketId, User actor) {
        Ticket ticket = findTicketOrThrow(ticketId);

        if (ticket.getStatus() != TicketStatus.WAITING_USER_CONFIRMATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ticket must be in WAITING_USER_CONFIRMATION status to confirm");
        }
        if (!ticket.getCreatedBy().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the ticket creator can confirm resolution");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setUserConfirmedAt(Instant.now());
        ticket.setClosedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());

        Ticket saved = ticketRepository.save(ticket);

        timelineService.record(saved.getId(), actor.getId(), actor.getName(),
                actor.getRole().name(), EventType.CLOSED,
                "Resolution confirmed by " + actor.getName() + " — ticket closed", Map.of());

        commentService.addSystemComment(saved.getId(),
                "✅ Resolution confirmed by " + actor.getName() + ". Ticket closed.");

        // Notify technician
        if (saved.getAssignedTechnician() != null) {
            notificationService.notify(saved.getAssignedTechnician(), "CLOSED",
                    "Ticket " + saved.getTicketId() + " closed",
                    "User confirmed resolution", saved.getId());
        }

        return TicketResponse.from(saved);
    }

    // ── DISPUTE RESOLUTION ──

    public TicketResponse disputeResolution(String ticketId, User actor, DisputeRequest request) {
        Ticket ticket = findTicketOrThrow(ticketId);

        if (ticket.getStatus() != TicketStatus.WAITING_USER_CONFIRMATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ticket must be in WAITING_USER_CONFIRMATION status to dispute");
        }
        if (!ticket.getCreatedBy().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the ticket creator can dispute resolution");
        }

        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setDisputeNote(request.getDisputeNote());
        ticket.setReopenCount(ticket.getReopenCount() + 1);
        ticket.setResolvedAt(null);
        ticket.setUpdatedAt(Instant.now());

        Ticket saved = ticketRepository.save(ticket);

        timelineService.record(saved.getId(), actor.getId(), actor.getName(),
                actor.getRole().name(), EventType.DISPUTED,
                "Resolution disputed by " + actor.getName() + ": " + request.getDisputeNote(),
                Map.of("disputeNote", request.getDisputeNote()));

        // Add dispute note as a special comment
        commentService.addSystemComment(saved.getId(),
                "⚠ User " + actor.getName() + " disputed the resolution: " + request.getDisputeNote());

        // Notify technician and admin
        if (saved.getAssignedTechnician() != null) {
            notificationService.notify(saved.getAssignedTechnician(), "DISPUTED",
                    "Ticket " + saved.getTicketId() + " — resolution disputed",
                    "User disputed: " + request.getDisputeNote(), saved.getId());
        }

        return TicketResponse.from(saved);
    }

    // ── QUERY METHODS ──

    public TicketResponse getById(String ticketId) {
        Ticket ticket = findTicketOrThrow(ticketId);
        // Re-evaluate SLA on read
        ticket.setSlaStatus(slaService.evaluateSla(ticket));
        ticketRepository.save(ticket);
        return enrichWithRecurringInfo(ticket);
    }

    public List<TicketResponse> getMyTickets(String userId) {
        return ticketRepository.findByCreatedByOrderByCreatedAtDesc(userId).stream()
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getAssignedTickets(String technicianId) {
        return ticketRepository.findByAssignedTechnicianOrderByCreatedAtDesc(technicianId).stream()
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getUnassignedTickets() {
        return ticketRepository.findByAssignedTechnicianIsNullAndStatusNot(TicketStatus.CLOSED).stream()
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getSlaBreached() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> slaService.evaluateSla(t) == SlaStatus.BREACHED)
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getSlaAtRisk() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> slaService.evaluateSla(t) == SlaStatus.AT_RISK)
                .map(this::refreshSlaAndMap)
                .collect(Collectors.toList());
    }

    // ── STATS ──

    public TicketStatsResponse getStats() {
        List<Ticket> all = ticketRepository.findAll();

        Instant startOfToday = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);

        long resolvedToday = all.stream()
                .filter(t -> t.getResolvedAt() != null && t.getResolvedAt().isAfter(startOfToday))
                .count();

        long breached = all.stream()
                .filter(t -> slaService.evaluateSla(t) == SlaStatus.BREACHED)
                .count();

        return TicketStatsResponse.builder()
                .open(ticketRepository.countByStatus(TicketStatus.OPEN))
                .inProgress(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS))
                .waitingConfirmation(ticketRepository.countByStatus(TicketStatus.WAITING_USER_CONFIRMATION))
                .onHold(ticketRepository.countByStatus(TicketStatus.ON_HOLD))
                .slaBreached(breached)
                .resolvedToday(resolvedToday)
                .closedTotal(ticketRepository.countByStatus(TicketStatus.CLOSED))
                .totalTickets(all.size())
                .build();
    }

    // ── HELPERS ──

    private Ticket findTicketOrThrow(String ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseGet(() -> ticketRepository.findByTicketId(ticketId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Ticket not found: " + ticketId)));
    }

    private void validateTransition(TicketStatus from, TicketStatus to) {
        Set<TicketStatus> allowed = VALID_TRANSITIONS.getOrDefault(from, Set.of());
        if (!allowed.contains(to)) {
            throw new InvalidStatusTransitionException(from.name(), to.name());
        }
    }

    private TicketResponse refreshSlaAndMap(Ticket ticket) {
        SlaStatus current = slaService.evaluateSla(ticket);
        if (ticket.getSlaStatus() != current) {
            ticket.setSlaStatus(current);
            ticketRepository.save(ticket);
        }
        return TicketResponse.from(ticket);
    }

    private TicketResponse enrichWithRecurringInfo(Ticket ticket) {
        TicketResponse response = TicketResponse.from(ticket);
        if (ticket.getResourceId() != null && ticket.getCategory() != null) {
            Instant thirtyDaysAgo = Instant.now().minus(30, java.time.temporal.ChronoUnit.DAYS);
            List<Ticket> similar = ticketRepository.findByResourceIdAndCategoryAndCreatedAtAfter(
                    ticket.getResourceId(), ticket.getCategory(), thirtyDaysAgo);
            if (similar.size() >= 3) {
                response.setRecurringIssue(true);
                response.setSimilarTicketCount(similar.size());
            }
        }
        return response;
    }
}
