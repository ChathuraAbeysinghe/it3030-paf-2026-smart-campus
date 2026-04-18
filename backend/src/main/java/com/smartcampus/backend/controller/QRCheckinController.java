package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

/**
 * QR Check-in Controller
 *
 * POST /api/bookings/{id}/checkin         — validate QR and mark checked in
 * GET  /api/bookings/{id}/checkin-status  — get check-in status (triggers auto-cancel check)
 * POST /api/bookings/auto-cancel-expired  — admin bulk auto-cancel (also run by scheduler)
 *
 * Check-in rules:
 *   - Check-in window OPENS  15 minutes before start time
 *   - Check-in window CLOSES 15 minutes after  start time
 *   - If user does NOT check in within 15 minutes of start → CANCELLED automatically
 *   - Booking must be APPROVED and QR code must match
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class QRCheckinController {

    private final BookingRepository bookingRepository;
    private final CurrentUserService currentUserService;

    // ── POST /api/bookings/{id}/checkin ──────────────────────────

    @PostMapping("/{id}/checkin")
    public ResponseEntity<?> checkin(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        // Only the booking owner or an admin can check in
        if (!booking.getUserId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Not authorised to check in this booking");
        }

        // Must be APPROVED
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only APPROVED bookings can be checked in. Current status: " + booking.getStatus());
        }

        // Already checked in?
        if (Boolean.TRUE.equals(booking.getCheckedIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This booking has already been checked in.");
        }

        // Validate QR code
        String providedQr = body.get("qrCode");
        if (providedQr == null || !providedQr.trim().equals(booking.getQrCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid QR code");
        }

        // Must be booking date
        LocalDate today = LocalDate.now();
        if (!today.equals(booking.getDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-in is only allowed on the booking date (" + booking.getDate() + ")");
        }

        // Check-in time window: (startTime - 15min) to (startTime + 15min)
        LocalTime now          = LocalTime.now();
        LocalTime windowOpen   = booking.getStartTime().minusMinutes(15);
        LocalTime windowClose  = booking.getStartTime().plusMinutes(15);

        if (now.isBefore(windowOpen)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-in not yet open. Opens at " + windowOpen
                            + " (15 minutes before start time " + booking.getStartTime() + ")");
        }
        if (now.isAfter(windowClose)) {
            // Auto-cancel since the window has passed
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setAdminNotes("Auto-cancelled: check-in window expired (15 minutes after start time)");
            booking.setUpdatedAt(Instant.now());
            bookingRepository.save(booking);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-in window has expired. The booking has been auto-cancelled.");
        }

        // All good — mark checked in
        booking.setCheckedIn(true);
        booking.setCheckedInAt(Instant.now());
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of(
                "message",     "Check-in successful! Enjoy your booking.",
                "bookingId",   booking.getId(),
                "checkedInAt", booking.getCheckedInAt().toString(),
                "facility",    booking.getFacilityId()
        ));
    }

    // ── GET /api/bookings/{id}/checkin-status ────────────────────

    @GetMapping("/{id}/checkin-status")
    public ResponseEntity<?> checkinStatus(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        currentUserService.resolveCurrentUser(principal, request);

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        // Trigger auto-cancel check for this booking
        boolean autoCancelled = false;
        if (booking.getStatus() == BookingStatus.APPROVED
                && !Boolean.TRUE.equals(booking.getCheckedIn())) {
            autoCancelled = maybeAutoCancel(booking);
        }

        // Compute seconds remaining until auto-cancel deadline (for countdown)
        Long secondsUntilDeadline = null;
        if (booking.getStatus() == BookingStatus.APPROVED
                && !Boolean.TRUE.equals(booking.getCheckedIn())
                && booking.getDate() != null
                && booking.getDate().equals(LocalDate.now())
                && booking.getStartTime() != null) {

            LocalTime deadline = booking.getStartTime().plusMinutes(15);
            LocalTime now      = LocalTime.now();
            if (now.isBefore(deadline)) {
                secondsUntilDeadline = (long) (
                        (deadline.toSecondOfDay() - now.toSecondOfDay())
                );
            }
        }

        return ResponseEntity.ok(Map.of(
                "bookingId",            booking.getId(),
                "status",               booking.getStatus().name(),
                "checkedIn",            Boolean.TRUE.equals(booking.getCheckedIn()),
                "checkedInAt",          booking.getCheckedInAt() != null
                                            ? booking.getCheckedInAt().toString() : "",
                "autoCancelled",        autoCancelled,
                "secondsUntilDeadline", secondsUntilDeadline != null ? secondsUntilDeadline : -1
        ));
    }

    // ── POST /api/bookings/auto-cancel-expired (admin) ───────────

    @PostMapping("/auto-cancel-expired")
    public ResponseEntity<?> autoCancelExpired(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        User actor = currentUserService.resolveCurrentUser(principal, request);
        if (actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        var approvedBookings = bookingRepository.findByStatus(BookingStatus.APPROVED)
                .stream()
                .filter(b -> !Boolean.TRUE.equals(b.getCheckedIn()))
                .toList();

        long cancelledCount = approvedBookings.stream()
                .filter(this::maybeAutoCancel)
                .count();

        return ResponseEntity.ok(Map.of(
                "checked",   approvedBookings.size(),
                "cancelled", cancelledCount,
                "message",   cancelledCount + " expired booking(s) auto-cancelled"
        ));
    }

    // ── Private helper ───────────────────────────────────────────

    /**
     * Auto-cancels a booking if the 15-minute check-in window has expired.
     * Returns true if the booking was cancelled.
     */
    private boolean maybeAutoCancel(Booking booking) {
        if (booking.getDate() == null || booking.getStartTime() == null) return false;

        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();

        // Cancel if booking date is in the past (not today)
        if (booking.getDate().isBefore(today)) {
            doCancel(booking);
            return true;
        }

        // Cancel if today and the 15-minute window has passed
        if (booking.getDate().equals(today)) {
            LocalTime deadline = booking.getStartTime().plusMinutes(15);
            if (now.isAfter(deadline)) {
                doCancel(booking);
                return true;
            }
        }

        return false;
    }

    private void doCancel(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setAdminNotes(
                "Auto-cancelled: no check-in within 15 minutes of start time (" + booking.getStartTime() + ")");
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);
    }
}