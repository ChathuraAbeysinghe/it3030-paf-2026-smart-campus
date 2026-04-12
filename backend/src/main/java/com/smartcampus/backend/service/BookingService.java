package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequest;
import com.smartcampus.backend.dto.BookingResponse;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.BookingRepository;
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

    private static final Set<BookingStatus> BLOCKING_STATUSES = Set.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

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

        Map<String, String> facilityNames = resourceRepository.findAllById(facilityIds)
                .stream().collect(Collectors.toMap(Resource::getId, Resource::getName));
        Map<String, String> userNames = userRepository.findAllById(userIds)
                .stream().collect(Collectors.toMap(User::getId, User::getName));

        return bookings.stream().map(b -> toResponse(b, facilityNames, userNames)).toList();
    }

    public BookingResponse getById(User actor, String id) {
        Booking booking = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, booking);
        return toResponse(booking);
    }

    public BookingResponse create(User actor, BookingRequest request) {
        validateRequest(request);
        Resource facility = getFacilityOrThrow(request.getFacilityId());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                null,
                BLOCKING_STATUSES
        );

        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requested time slot conflicts with an existing booking");
        }

        Instant now = Instant.now();
        Booking booking = Booking.builder()
                .facilityId(facility.getId())
                .userId(actor.getId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getAttendees())
                .status(BookingStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(bookingRepository.save(booking));
    }

    public BookingResponse update(User actor, String id, BookingRequest request) {
        validateRequest(request);
        Booking existing = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, existing);
        ensurePending(existing);
        getFacilityOrThrow(request.getFacilityId());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                existing.getId(),
                BLOCKING_STATUSES
        );

        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requested time slot conflicts with an existing booking");
        }

        existing.setFacilityId(request.getFacilityId().trim());
        existing.setDate(request.getDate());
        existing.setStartTime(request.getStartTime());
        existing.setEndTime(request.getEndTime());
        existing.setPurpose(request.getPurpose().trim());
        existing.setExpectedAttendees(request.getAttendees());
        existing.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(existing));
    }

    //Generate QR code on approve
    public BookingResponse approve(User actor, String id, String adminNotes) {
        ensureAdmin(actor);
        Booking booking = getByIdOrThrow(id);
        ensurePending(booking);

        List<Booking> approvedConflicts = findConflicts(
                booking.getFacilityId(),
                booking.getDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId(),
                Set.of(BookingStatus.APPROVED)
        );

        if (!approvedConflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot approve due to existing approved booking conflict");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminNotes(normalizeNote(adminNotes));
        //Set QR code when approved
        booking.setQrCode("QR-" + id.substring(0, 8).toUpperCase() + "-" + LocalDate.now().getYear());
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    public BookingResponse reject(User actor, String id, String reason) {
        ensureAdmin(actor);
        Booking booking = getByIdOrThrow(id);
        ensurePending(booking);

        String note = normalizeNote(reason);
        if (note == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminNotes(note);
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    //Allow PENDING bookings to be cancelled by owner
    public BookingResponse cancel(User actor, String id) {
        Booking booking = getByIdOrThrow(id);
        ensureOwnerOrAdmin(actor, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking is already " + booking.getStatus().name().toLowerCase());
        }

        // Only admin can cancel an already-approved booking
        if (booking.getStatus() == BookingStatus.APPROVED) {
            ensureAdmin(actor);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(Instant.now());

        return toResponse(bookingRepository.save(booking));
    }

    public List<BookingResponse> getFacilityConflicts(String facilityId, LocalDate date) {
        if (facilityId == null || facilityId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Facility ID is required");
        }
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date is required");
        }

        List<Booking> bookings = bookingRepository.findByFacilityIdAndDateAndStatusIn(
                facilityId.trim(),
                date,
                BLOCKING_STATUSES
        );

        return bookings.stream()
                .sorted(Comparator.comparing(Booking::getStartTime))
                .map(this::toResponse)
                .toList();
    }

    // ── Private helpers ──

    private void validateRequest(BookingRequest request) {
        if (request.getStartTime() != null
                && request.getEndTime() != null
                && !request.getStartTime().isBefore(request.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
    }

    private Booking getByIdOrThrow(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private Resource getFacilityOrThrow(String facilityId) {
        if (facilityId == null || facilityId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Facility ID is required");
        }
        return resourceRepository.findById(facilityId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Facility not found"));
    }

    private List<Booking> findConflicts(
            String facilityId,
            LocalDate date,
            LocalTime start,
            LocalTime end,
            String excludeBookingId,
            Set<BookingStatus> statuses
    ) {
        return bookingRepository.findByFacilityIdAndDateAndStatusIn(facilityId.trim(), date, statuses).stream()
                .filter(existing -> excludeBookingId == null || !excludeBookingId.equals(existing.getId()))
                .filter(existing -> overlaps(start, end, existing.getStartTime(), existing.getEndTime()))
                .toList();
    }

    private boolean overlaps(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private void ensureAdmin(User actor) {
        if (actor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private void ensureOwnerOrAdmin(User actor, Booking booking) {
        if (actor.getRole() == Role.ADMIN) return;
        if (!booking.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this booking");
        }
    }

    private void ensurePending(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking can only be modified while PENDING");
        }
    }

    private String normalizeNote(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BookingResponse toResponse(Booking booking,
                                        Map<String, String> facilityNames,
                                        Map<String, String> userNames) {
        return BookingResponse.builder()
                .id(booking.getId())
                .facilityId(booking.getFacilityId())
                .facilityName(facilityNames.getOrDefault(booking.getFacilityId(), booking.getFacilityId()))
                .userId(booking.getUserId())
                .userName(userNames.getOrDefault(booking.getUserId(), booking.getUserId()))
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .adminNotes(booking.getAdminNotes())
                .qrCode(booking.getQrCode())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    // ── Single booking version — used by create/update/approve/reject/cancel ──
    private BookingResponse toResponse(Booking booking) {
        String facilityName = resourceRepository.findById(booking.getFacilityId())
                .map(Resource::getName).orElse(booking.getFacilityId());
        String userName = userRepository.findById(booking.getUserId())
                .map(User::getName).orElse(booking.getUserId());
        return toResponse(booking,
                Map.of(booking.getFacilityId(), facilityName),
                Map.of(booking.getUserId(), userName));
    }
}