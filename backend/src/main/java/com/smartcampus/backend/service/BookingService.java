package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.BookingRequest;
import com.smartcampus.backend.dto.BookingResponse;
import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import com.smartcampus.backend.model.BookingType;
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

    private static final Set<BookingStatus> BLOCKING_STATUSES =
            Set.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private static final double MIN_OCCUPANCY_RATIO = 0.6;

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
        Set<String> userIds = bookings.stream().map(Booking::getUserId).collect(Collectors.toSet());

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

    public BookingResponse create(User actor, BookingRequest request) {
        validateRequest(request);
        Resource facility = getFacilityOrThrow(request.getFacilityId());
        validateCapacity(request.getAttendees(), facility);
        BookingType bookingType = resolveBookingType(request.getAttendees(), facility.getCapacity());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                null,
                BLOCKING_STATUSES
        );

        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Requested time slot conflicts with an existing booking");
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
                .bookingType(bookingType)
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

        Resource facility = getFacilityOrThrow(request.getFacilityId());
        validateCapacity(request.getAttendees(), facility);
        BookingType bookingType = resolveBookingType(request.getAttendees(), facility.getCapacity());

        List<Booking> conflicts = findConflicts(
                request.getFacilityId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime(),
                existing.getId(),
                BLOCKING_STATUSES
        );

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
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot approve due to existing approved booking conflict");
        }

        booking.setStatus(BookingStatus.APPROVED);
        booking.setAdminNotes(normalizeNote(adminNotes));
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

    private void validateCapacity(int attendees, Resource facility) {
        if (facility.getCapacity() != null && attendees > facility.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Attendees (" + attendees + ") exceed the capacity of "
                            + facility.getName() + " (" + facility.getCapacity() + ")");
        }
    }

    private BookingType resolveBookingType(int attendees, Integer capacity) {
        if (capacity == null || capacity == 0) return BookingType.BOOKING;
        int minRequired = (int) Math.ceil(capacity * MIN_OCCUPANCY_RATIO);
        return attendees >= minRequired ? BookingType.BOOKING : BookingType.REQUEST;
    }

    private int computeMinRequired(Integer capacity) {
        if (capacity == null || capacity == 0) return 1;
        return (int) Math.ceil(capacity * MIN_OCCUPANCY_RATIO);
    }

    private void validateTimes(BookingRequest request) {
        if (request.getStartTime() != null && request.getEndTime() != null
                && !request.getStartTime().isBefore(request.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
    }

    private void validateRequest(BookingRequest request) {
        validateTimes(request);
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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to access this booking");
        }
    }

    private void ensurePending(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking can only be modified while PENDING");
        }
    }

    private String normalizeNote(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BookingResponse toResponse(
            Booking booking,
            Map<String, Resource> facilityMap,
            Map<String, String> userNames
    ) {
        Resource facility = facilityMap.get(booking.getFacilityId());
        String facilityName = facility != null ? facility.getName() : booking.getFacilityId();
        Integer capacity = facility != null ? facility.getCapacity() : null;

        return BookingResponse.builder()
                .id(booking.getId())
                .facilityId(booking.getFacilityId())
                .facilityName(facilityName)
                .facilityCapacity(capacity)
                .minimumAttendeesRequired(computeMinRequired(capacity))
                .userId(booking.getUserId())
                .userName(userNames.getOrDefault(booking.getUserId(), booking.getUserId()))
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .bookingType(booking.getBookingType())
                .adminNotes(booking.getAdminNotes())
                .qrCode(booking.getQrCode())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private BookingResponse toResponse(Booking booking) {
        Resource facility = resourceRepository.findById(booking.getFacilityId()).orElse(null);
        String facilityName = facility != null ? facility.getName() : booking.getFacilityId();
        Integer capacity = facility != null ? facility.getCapacity() : null;
        String userName = userRepository.findById(booking.getUserId())
                .map(User::getName).orElse(booking.getUserId());

        return BookingResponse.builder()
                .id(booking.getId())
                .facilityId(booking.getFacilityId())
                .facilityName(facilityName)
                .facilityCapacity(capacity)
                .minimumAttendeesRequired(computeMinRequired(capacity))
                .userId(booking.getUserId())
                .userName(userName)
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .bookingType(booking.getBookingType())
                .adminNotes(booking.getAdminNotes())
                .qrCode(booking.getQrCode())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}