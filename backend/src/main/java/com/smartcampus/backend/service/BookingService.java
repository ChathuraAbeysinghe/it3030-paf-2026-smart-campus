package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequest;
import com.smartcampus.backend.dto.BookingResponse;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.BookingType;
import com.smartcampus.backend.model.Notification;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.BookingRepository;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Set<BookingStatus> BLOCKING_STATUSES =
            Set.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private static final double MIN_OCCUPANCY_RATIO = 0.60;

    public static final String AUTO_APPROVE_NOTE =
            "Auto-approved: attendance meets minimum requirement";

    private final BookingRepository      bookingRepository;
    private final ResourceRepository     resourceRepository;
    private final UserRepository         userRepository;
    private final NotificationRepository notificationRepository;

    // ── Get bookings ─────────────────────────────────────────────
    public List<BookingResponse> getBookings(User actor, BookingStatus status) {
        List<Booking> bookings;
        if (actor.getRole() == Role.ADMIN) {
            bookings = status == null
                    ? bookingRepository.findAllByOrderByCreatedAtDesc()
                    : bookingRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            bookings = status == null
                    ? bookingRepository.findByUserIdOrderByCreatedAtDesc(actor.getId())
                    : bookingRepository.findByUserIdAndStatusOrderByCreatedAtDesc(actor.getId(), status);
        }

        Set<String> facilityIds = bookings.stream().map(Booking::getFacilityId).collect(Collectors.toSet());
        Set<String> userIds     = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());

        Map<String, Resource> facilityMap = resourceRepository.findAllById(facilityIds)
                .stream().collect(Collectors.toMap(Resource::getId, r -> r));
        Map<String, String> userNames = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, User::getName));

        return bookings.stream().map(b -> toResponse(b, facilityMap, userNames)).toList();
    }

    public BookingResponse getById(User actor, String id) {
        Booking booking = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, booking);
        return toResponse(booking);
    }

    // ── Get by QR code (admin scanner) ───────────────────────────
    public BookingResponse getByQrCode(String qrCode) {
        return bookingRepository.findByQrCode(qrCode)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "QR code not found"));
    }

    // ── Check-in via booking ID (admin scanned QR) ────────────────
    public BookingResponse checkIn(User admin, String id) {
        ensureAdmin(admin);
        Booking booking = getByIdOrThrow(id);

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only APPROVED bookings can be checked in. Current status: " + booking.getStatus());
        }
        if (Boolean.TRUE.equals(booking.getCheckedIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This booking has already been checked in at " + booking.getCheckedInAt());
        }

        booking.setCheckedIn(true);
        booking.setCheckedInAt(Instant.now());
        booking.setCheckedInBy(admin.getId());
        booking.setUpdatedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);

        // Notify user
        Resource facility = resourceRepository.findById(booking.getFacilityId()).orElse(null);
        String facilityName = facility != null ? facility.getName() : booking.getFacilityId();
        saveNotification(booking.getUserId(), "📍 Checked In",
                "You have successfully checked in for " + facilityName
                + " on " + booking.getDate()
                + " (" + booking.getStartTime() + "–" + booking.getEndTime() + ")");

        return toResponse(saved);
    }

    // ── Create ───────────────────────────────────────────────────
    public BookingResponse create(User actor, BookingRequest request) {
        validateTimes(request);
        Resource facility = getFacilityOrThrow(request.getFacilityId());
        validateCapacity(request.getAttendees(), facility);
        BookingType bookingType = resolveBookingType(request.getAttendees(), facility.getCapacity());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(), request.getDate(),
                request.getStartTime(), request.getEndTime(),
                null, BLOCKING_STATUSES);
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Requested time slot conflicts with an existing booking");
        }

        Instant now         = Instant.now();
        boolean autoApprove = (bookingType == BookingType.BOOKING);

        Booking booking = Booking.builder()
                .facilityId(facility.getId())
                .userId(actor.getId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getAttendees())
                .bookingType(bookingType)
                .checkedIn(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        if (autoApprove) {
            booking.setStatus(BookingStatus.APPROVED);
            booking.setAdminNotes(AUTO_APPROVE_NOTE);
            booking.setQrCode("QR-" + java.util.UUID.randomUUID()
                    .toString().substring(0, 8).toUpperCase());
        } else {
            booking.setStatus(BookingStatus.PENDING);
        }

        Booking saved = bookingRepository.save(booking);

        if (autoApprove) {
            notifyAdmins("⚡ Auto-Approved Booking",
                    actor.getName() + " booked " + facility.getName()
                    + " on " + request.getDate()
                    + " (" + request.getStartTime() + "–" + request.getEndTime() + ")"
                    + "  ·  " + request.getAttendees() + "/" + facility.getCapacity() + " attendees");
            saveNotification(actor.getId(), "✅ Booking Auto-Approved",
                    "Your booking for " + facility.getName()
                    + " on " + request.getDate() + " was automatically approved! Your QR code is ready.");
        } else {
            notifyAdmins("📩 New Booking Request",
                    actor.getName() + " requested " + facility.getName()
                    + " on " + request.getDate()
                    + " — needs approval (attendance below 60%)");
        }

        return toResponse(saved);
    }

    // ── Update ───────────────────────────────────────────────────
    public BookingResponse update(User actor, String id, BookingRequest request) {
        validateTimes(request);
        Booking existing = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, existing);
        ensurePending(existing);

        Resource facility = getFacilityOrThrow(request.getFacilityId());
        validateCapacity(request.getAttendees(), facility);
        BookingType bookingType = resolveBookingType(request.getAttendees(), facility.getCapacity());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(), request.getDate(),
                request.getStartTime(), request.getEndTime(),
                existing.getId(), BLOCKING_STATUSES);
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Requested time slot conflicts with an existing booking");
        }

        existing.setFacilityId(request.getFacilityId().trim());
        existing.setDate(request.getDate());
        existing.setStartTime(request.getStartTime());
        existing.setEndTime(request.getEndTime());
        existing.setPurpose(request.getPurpose().trim());
        existing.setExpectedAttendees(request.getAttendees());
        existing.setBookingType(bookingType);
        existing.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(existing));
    }

    // ── Approve (manual) ─────────────────────────────────────────
    public BookingResponse approve(User actor, String id, String adminNotes) {
        ensureAdmin(actor);
        Booking booking = getByIdOrThrow(id);
        ensurePending(booking);

        List<Booking> approvedConflicts = findConflicts(
                booking.getFacilityId(), booking.getDate(),
                booking.getStartTime(), booking.getEndTime(),
                booking.getId(), Set.of(BookingStatus.APPROVED));
        if (!approvedConflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot approve due to existing approved booking conflict");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminNotes(normalizeNote(adminNotes));
        booking.setQrCode("QR-" + id.substring(0, 8).toUpperCase()
                + "-" + LocalDate.now().getYear());
        booking.setUpdatedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);

        saveNotification(booking.getUserId(), "✅ Booking Approved",
                "Your booking has been approved. Your QR code is ready for check-in.");

        return toResponse(saved);
    }

    // ── Reject ───────────────────────────────────────────────────
    public BookingResponse reject(User actor, String id, String reason) {
        ensureAdmin(actor);
        Booking booking = getByIdOrThrow(id);
        ensurePending(booking);

        String note = normalizeNote(reason);
        if (note == null) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Rejection reason is required");

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminNotes(note);
        booking.setUpdatedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);

        saveNotification(booking.getUserId(), "❌ Booking Rejected",
                "Your booking was rejected. Reason: " + note);

        return toResponse(saved);
    }

    // ── Cancel ───────────────────────────────────────────────────
    public BookingResponse cancel(User actor, String id) {
        Booking booking = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking is already " + booking.getStatus().name().toLowerCase());
        }
        if (booking.getStatus() == BookingStatus.APPROVED) {
            ensureAdmin(actor);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    // ── Facility conflicts ────────────────────────────────────────
    public List<BookingResponse> getFacilityConflicts(String facilityId, LocalDate date) {
        if (facilityId == null || facilityId.trim().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Facility ID is required");
        if (date == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date is required");

        return bookingRepository
                .findByFacilityIdAndDateAndStatusIn(facilityId.trim(), date, BLOCKING_STATUSES)
                .stream()
                .sorted(Comparator.comparing(Booking::getStartTime))
                .map(this::toResponse)
                .toList();
    }

    // ── Notification helpers ──────────────────────────────────────
    private void notifyAdmins(String title, String message) {
        try {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .forEach(admin -> saveNotification(admin.getId(), title, message));
        } catch (Exception ignored) { }
    }

    private void saveNotification(String userId, String title, String message) {
        try {
            notificationRepository.save(Notification.builder()
                    .userId(userId).title(title).message(message)
                    .read(false).createdAt(Instant.now()).build());
        } catch (Exception ignored) { }
    }

    // ── Validation helpers ────────────────────────────────────────
    private void validateCapacity(int attendees, Resource facility) {
        if (facility.getCapacity() != null && attendees > facility.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Attendees (" + attendees + ") exceed the capacity of "
                    + facility.getName() + " (" + facility.getCapacity() + ")");
        }
    }

    private BookingType resolveBookingType(int attendees, Integer capacity) {
        if (capacity == null || capacity == 0) return BookingType.BOOKING;
        int min = (int) Math.ceil(capacity * MIN_OCCUPANCY_RATIO);
        return attendees >= min ? BookingType.BOOKING : BookingType.REQUEST;
    }

    private int computeMinRequired(Integer capacity) {
        if (capacity == null || capacity == 0) return 1;
        return (int) Math.ceil(capacity * MIN_OCCUPANCY_RATIO);
    }

    private void validateTimes(BookingRequest request) {
        if (request.getStartTime() != null && request.getEndTime() != null
                && !request.getStartTime().isBefore(request.getEndTime()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Start time must be before end time");
    }

    private Booking getByIdOrThrow(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private Resource getFacilityOrThrow(String facilityId) {
        if (facilityId == null || facilityId.trim().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Facility ID is required");
        return resourceRepository.findById(facilityId.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Facility not found"));
    }

    private List<Booking> findConflicts(String facilityId, LocalDate date,
            LocalTime start, LocalTime end, String excludeId, Set<BookingStatus> statuses) {
        return bookingRepository
                .findByFacilityIdAndDateAndStatusIn(facilityId.trim(), date, statuses).stream()
                .filter(e -> excludeId == null || !excludeId.equals(e.getId()))
                .filter(e -> overlaps(start, end, e.getStartTime(), e.getEndTime()))
                .toList();
    }

    private boolean overlaps(LocalTime sA, LocalTime eA, LocalTime sB, LocalTime eB) {
        return sA.isBefore(eB) && eA.isAfter(sB);
    }

    private void ensureAdmin(User actor) {
        if (actor.getRole() != Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }

    private void ensureOwnerOrAdmin(User actor, Booking booking) {
        if (actor.getRole() == Role.ADMIN) return;
        if (!booking.getUserId().equals(actor.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to access this booking");
    }

    private void ensurePending(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking can only be modified while PENDING");
    }

    private String normalizeNote(String raw) {
        if (raw == null) return null;
        String t = raw.trim();
        return t.isEmpty() ? null : t;
    }

    // ── toResponse — batch ────────────────────────────────────────
    private BookingResponse toResponse(Booking b, Map<String, Resource> fm, Map<String, String> un) {
        Resource facility   = fm.get(b.getFacilityId());
        String facilityName = facility != null ? facility.getName() : b.getFacilityId();
        Integer capacity    = facility != null ? facility.getCapacity() : null;
        return buildResponse(b, facilityName, capacity,
                un.getOrDefault(b.getUserId(), b.getUserId()), null);
    }

    // ── toResponse — single ───────────────────────────────────────
    private BookingResponse toResponse(Booking b) {
        Resource facility   = resourceRepository.findById(b.getFacilityId()).orElse(null);
        String facilityName = facility != null ? facility.getName() : b.getFacilityId();
        Integer capacity    = facility != null ? facility.getCapacity() : null;
        User user           = userRepository.findById(b.getUserId()).orElse(null);
        String userName     = user != null ? user.getName() : b.getUserId();
        String userEmail    = user != null ? user.getEmail() : null;
        return buildResponse(b, facilityName, capacity, userName, userEmail);
    }

    private BookingResponse buildResponse(Booking b, String facilityName,
            Integer capacity, String userName, String userEmail) {
        return BookingResponse.builder()
                .id(b.getId())
                .facilityId(b.getFacilityId())
                .facilityName(facilityName)
                .facilityCapacity(capacity)
                .minimumAttendeesRequired(computeMinRequired(capacity))
                .userId(b.getUserId())
                .userName(userName)
                .userEmail(userEmail)
                .date(b.getDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .purpose(b.getPurpose())
                .expectedAttendees(b.getExpectedAttendees())
                .status(b.getStatus())
                .bookingType(b.getBookingType())
                .adminNotes(b.getAdminNotes())
                .qrCode(b.getQrCode())
                .checkedIn(b.getCheckedIn())
                .checkedInAt(b.getCheckedInAt())
                .checkedInBy(b.getCheckedInBy())
                .autoCancelled(b.isAutoCancelled())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}