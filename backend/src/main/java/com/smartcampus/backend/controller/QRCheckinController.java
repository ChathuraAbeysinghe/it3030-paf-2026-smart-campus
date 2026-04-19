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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService     bookingService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<BookingResponse> getAll(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request,
            @RequestParam(required = false) String status) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.getBookings(actor, parseStatus(status));
    }

    @GetMapping("/{id}")
    public BookingResponse getById(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.getById(actor, id);
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @Valid @RequestBody BookingRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.create(actor, body));
    }

    @PutMapping("/{id}")
    public BookingResponse update(
            @PathVariable String id,
            @Valid @RequestBody BookingRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.update(actor, id, body);
    }

    @PatchMapping("/{id}/approve")
    public BookingResponse approve(
            @PathVariable String id,
            @RequestBody(required = false) BookingDecisionRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.approve(actor, id, body == null ? null : body.getAdminNotes());
    }

    @PatchMapping("/{id}/reject")
    public BookingResponse reject(
            @PathVariable String id,
            @Valid @RequestBody BookingDecisionRequest body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.reject(actor, id, body.getAdminNotes());
    }

    @PatchMapping("/{id}/cancel")
    public BookingResponse cancel(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.cancel(actor, id);
    }

    /**
     * PATCH /api/bookings/{id}/checkin
     * Admin scans QR → looks up booking by ID → marks checked in.
     */
    @PatchMapping("/{id}/checkin")
    public BookingResponse checkIn(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        User actor = currentUserService.resolveCurrentUser(principal, request);
        return bookingService.checkIn(actor, id);
    }

    /**
     * GET /api/bookings/qr/{qrCode}
     * Admin scanner: look up booking by QR code string.
     * Returns full booking details so admin can confirm before check-in.
     */
    @GetMapping("/qr/{qrCode}")
    public BookingResponse getByQrCode(
            @PathVariable String qrCode,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {
        currentUserService.resolveCurrentUser(principal, request);
        return bookingService.getByQrCode(qrCode);
    }

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
        if (raw == null || raw.isBlank() || "ALL".equalsIgnoreCase(raw.trim())) return null;
        try { return BookingStatus.fromValue(raw); }
        catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}