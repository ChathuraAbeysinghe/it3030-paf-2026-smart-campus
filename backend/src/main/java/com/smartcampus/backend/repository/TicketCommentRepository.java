package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketComment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketCommentRepository extends MongoRepository<TicketComment, String> {

    List<TicketComment> findByTicketIdOrderByTimestampAsc(String ticketId);
}
