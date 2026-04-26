package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.BookingDecisionRequest;
import com.smartcampus.backend.dto.BookingRequest;
import com.smartcampus.backend.dto.BookingResponse;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.BookingService;
import com.smartcampus.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    /*
     Get all bookings — Admins see all bookings, users see only their own
     */
    @GetMapping
    public List<BookingResponse> getAll(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request,
            @RequestParam(required = false) String status) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        BookingStatus bookingStatus = parseStatus(status);
        return bookingService.getBookings(actor, bookingStatus);
    }

    /*
     Retrieve a specific booking by ID
     */
    @GetMapping("/{id}")
    public BookingResponse getById(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.getById(actor, id);
    }

    /*
     Create a new booking
     */
    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody BookingRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        BookingResponse created = bookingService.create(actor, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /*
     Update an existing PENDING booking — owner and admin can
     */
    @PutMapping("/{id}")
    public BookingResponse update(
            @PathVariable String id,
            @Valid @RequestBody BookingRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.update(actor, id, body);
    }

    /*
     Approve a PENDING booking — admin only
     */
    @PatchMapping("/{id}/approve")
    public BookingResponse approve(
            @PathVariable String id,
            @RequestBody(required = false) BookingDecisionRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        String adminNotes = body == null ? null : body.getAdminNotes();
        return bookingService.approve(actor, id, adminNotes);
    }

    /*
     Reject a PENDING booking — admin only
     */
    @PatchMapping("/{id}/reject")
    public BookingResponse reject(
            @PathVariable String id,
            @Valid @RequestBody BookingDecisionRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.reject(actor, id, body.getAdminNotes());
    }

    /*
     Cancel an APPROVED booking — owner only (admin can also cancel)
     */
    @PatchMapping("/{id}/cancel")
    public BookingResponse cancel(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.cancel(actor, id);
    }

    /*
     Delete a booking — owner/admin can remove non-approved bookings
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        bookingService.delete(actor, id);
        return ResponseEntity.noContent().build();
    }

    /*
     Get facility conflicts for a given date (used by availability checker)
     */
    @GetMapping("/facility/{facilityId}/conflicts")
    public List<BookingResponse> getFacilityConflicts(
            @PathVariable String facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        currentUserService.resolveCurrentUser(principal, request);
        return bookingService.getFacilityConflicts(facilityId, date);
    }

    private BookingStatus parseStatus(String raw) {
        if (raw == null || raw.trim().isEmpty() || "ALL".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        try {
            return BookingStatus.fromValue(raw);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}