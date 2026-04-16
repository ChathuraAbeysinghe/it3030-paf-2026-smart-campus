package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.*;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.CurrentUserService;
import com.smartcampus.backend.service.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final CurrentUserService currentUserService;

    /**
     * Create a new ticket (USER, TECHNICIAN).
     */
    @PostMapping
    public ResponseEntity<TicketResponse> create(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        TicketResponse created = ticketService.createTicket(actor, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get my tickets (current user).
     */
    @GetMapping("/my")
    public List<TicketResponse> getMyTickets(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getMyTickets(actor.getId());
    }

    /**
     * Get all tickets (ADMIN).
     */
    @GetMapping
    public List<TicketResponse> getAllTickets(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getAllTickets();
    }

    /**
     * Get assigned tickets (TECHNICIAN).
     */
    @GetMapping("/assigned")
    public List<TicketResponse> getAssignedTickets(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getAssignedTickets(actor.getId());
    }

    /**
     * Get unassigned tickets.
     */
    @GetMapping("/unassigned")
    public List<TicketResponse> getUnassignedTickets(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getUnassignedTickets();
    }

    /**
     * Get ticket by ID.
     */
    @GetMapping("/{id}")
    public TicketResponse getById(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getById(id);
    }

    /**
     * Update ticket status.
     */
    @PutMapping("/{id}/status")
    public TicketResponse updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.updateStatus(id, actor, request);
    }

    /**
     * Assign technician to ticket (ADMIN).
     */
    @PostMapping("/{id}/assign")
    public TicketResponse assignTechnician(
            @PathVariable String id,
            @Valid @RequestBody AssignTicketRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.assignTechnician(id, actor, request);
    }

    /**
     * User confirms resolution.
     */
    @PostMapping("/{id}/confirm")
    public TicketResponse confirmResolution(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.confirmResolution(id, actor);
    }

    /**
     * User disputes resolution.
     */
    @PostMapping("/{id}/dispute")
    public TicketResponse disputeResolution(
            @PathVariable String id,
            @Valid @RequestBody DisputeRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.disputeResolution(id, actor, request);
    }

    /**
     * Get SLA breached tickets.
     */
    @GetMapping("/sla-breached")
    public List<TicketResponse> getSlaBreached(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getSlaBreached();
    }

    /**
     * Get SLA at-risk tickets.
     */
    @GetMapping("/sla-at-risk")
    public List<TicketResponse> getSlaAtRisk(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getSlaAtRisk();
    }

    /**
     * Dashboard stats.
     */
    @GetMapping("/stats")
    public TicketStatsResponse getStats(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        currentUserService.resolveCurrentUser(principal, httpRequest);
        return ticketService.getStats();
    }
}
