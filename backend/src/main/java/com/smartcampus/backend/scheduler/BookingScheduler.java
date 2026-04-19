package com.smartcampus.backend.scheduler;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * BookingScheduler — Auto-Cancel No Shows
 *
 * Runs every 5 minutes.
 * Cancels APPROVED bookings where no check-in was recorded
 * within 30 minutes of the start time.
 *
 * IMPORTANT: Add @EnableScheduling to SmartCampusBackendApplication.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingScheduler {

    private static final int GRACE_MINUTES = 30;

    private final BookingRepository      bookingRepository;
    private final NotificationRepository notificationRepository;

    @Scheduled(fixedDelay = 300_000) // every 5 minutes
    public void autoCancelNoShows() {
        LocalDate today   = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        // Today's approved bookings not yet checked in
        List<Booking> candidates = bookingRepository
                .findByDateAndStatusAndCheckedInFalse(today, BookingStatus.APPROVED);

        int cancelledCount = 0;

        for (Booking booking : candidates) {
            if (booking.getStartTime() == null) continue;

            LocalTime deadline = booking.getStartTime().plusMinutes(GRACE_MINUTES);

            if (nowTime.isAfter(deadline)) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setAdminNotes(
                        "Auto-cancelled: no check-in within " + GRACE_MINUTES
                        + " minutes of start time (" + booking.getStartTime() + ")");
                booking.setAutoCancelled(true);
                booking.setUpdatedAt(Instant.now());
                bookingRepository.save(booking);
                cancelledCount++;

                saveNotification(booking.getUserId(),
                        "⚠️ Booking Auto-Cancelled",
                        "Your booking was auto-cancelled because no check-in was recorded within "
                        + GRACE_MINUTES + " minutes of the start time ("
                        + booking.getStartTime() + ").");

                log.info("Auto-cancelled booking {} (facility: {}, start: {})",
                        booking.getId(), booking.getFacilityId(), booking.getStartTime());
            }
        }

        if (cancelledCount > 0) {
            log.info("Auto-cancel scheduler: cancelled {} booking(s)", cancelledCount);
        }
    }

    private void saveNotification(String userId, String title, String message) {
        try {
            notificationRepository.save(Notification.builder()
                    .userId(userId).title(title).message(message)
                    .read(false).createdAt(Instant.now()).build());
        } catch (Exception ex) {
            log.warn("Failed to save notification: {}", ex.getMessage());
        }
    }
}