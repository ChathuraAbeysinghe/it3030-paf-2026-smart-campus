package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * BookingScheduler
 *
 * Runs every 60 seconds and automatically cancels APPROVED bookings
 * where the user did NOT check in within 15 minutes of the start time.
 *
 * This ensures that if the frontend is not open, auto-cancel still happens
 * reliably on the server side.
 *
 * IMPORTANT: Add @EnableScheduling to your main application class or config:
 *
 *   @SpringBootApplication
 *   @EnableScheduling          ← add this
 *   public class SmartCampusBackendApplication { ... }
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingScheduler {

    private final BookingRepository bookingRepository;

    /**
     * Runs every 60 seconds.
     * Finds all APPROVED bookings that:
     *   1. Have not been checked in (checkedIn == false / null)
     *   2. Booking date is today and startTime + 15 minutes has passed, OR
     *      booking date is in the past
     * And cancels them, freeing the time slot.
     */
    @Scheduled(fixedRate = 60_000)
    public void autoCancelExpiredBookings() {
        List<Booking> approvedBookings = bookingRepository.findByStatus(BookingStatus.APPROVED)
                .stream()
                .filter(b -> !Boolean.TRUE.equals(b.getCheckedIn()))
                .filter(b -> b.getDate() != null && b.getStartTime() != null)
                .toList();

        if (approvedBookings.isEmpty()) return;

        LocalDate today = LocalDate.now();
        LocalTime now   = LocalTime.now();
        int cancelledCount = 0;

        for (Booking booking : approvedBookings) {
            boolean shouldCancel = false;

            // Past date — definitely expired
            if (booking.getDate().isBefore(today)) {
                shouldCancel = true;
            }
            // Today — check if 15-minute grace window has passed
            else if (booking.getDate().equals(today)) {
                LocalTime deadline = booking.getStartTime().plusMinutes(15);
                if (now.isAfter(deadline)) {
                    shouldCancel = true;
                }
            }

            if (shouldCancel) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setAdminNotes(
                        "Auto-cancelled: no check-in within 15 minutes of start time ("
                                + booking.getStartTime() + ")");
                booking.setUpdatedAt(Instant.now());
                bookingRepository.save(booking);
                cancelledCount++;
                log.info("Auto-cancelled booking {} (facility: {}, date: {}, startTime: {})",
                        booking.getId(), booking.getFacilityId(),
                        booking.getDate(), booking.getStartTime());
            }
        }

        if (cancelledCount > 0) {
            log.info("Auto-cancel scheduler: cancelled {} booking(s)", cancelledCount);
        }
    }
}