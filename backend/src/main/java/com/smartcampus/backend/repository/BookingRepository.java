package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Booking;
import com.smartcampus.backend.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, BookingStatus status);

    List<Booking> findByFacilityIdAndDateAndStatusIn(String facilityId, LocalDate date, Collection<BookingStatus> statuses);
}
