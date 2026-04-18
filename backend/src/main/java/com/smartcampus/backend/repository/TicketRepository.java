package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.enums.TicketCategory;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    Optional<Ticket> findByTicketId(String ticketId);

    List<Ticket> findByCreatedByOrderByCreatedAtDesc(String userId);

    List<Ticket> findByAssignedTechnicianOrderByCreatedAtDesc(String technicianId);

    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<Ticket> findByAssignedTechnicianIsNullAndStatusNot(TicketStatus status);

    long countByAssignedTechnicianAndStatusIn(String technicianId, List<TicketStatus> statuses);

    long countByStatus(TicketStatus status);

    List<Ticket> findByResourceIdAndCategoryAndCreatedAtAfter(
            String resourceId, TicketCategory category, Instant after);

    List<Ticket> findAllByOrderByCreatedAtDesc();
}
