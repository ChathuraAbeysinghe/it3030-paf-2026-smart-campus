package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, BookingStatus status);

    List<Booking> findByFacilityIdAndDateAndStatusIn(String facilityId, LocalDate date, Collection<BookingStatus> statuses);

    // QR scan lookup
    Optional<Booking> findByQrCode(String qrCode);

    // Auto-cancel scheduler — all approved bookings
    List<Booking> findByStatus(BookingStatus status);

    // Auto-cancel scheduler — today's approved, not checked in
    List<Booking> findByDateAndStatusAndCheckedInFalse(LocalDate date, BookingStatus status);
}