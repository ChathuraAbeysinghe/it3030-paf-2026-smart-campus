package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketTimeline;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketTimelineRepository extends MongoRepository<TicketTimeline, String> {

    List<TicketTimeline> findByTicketIdOrderByTimestampAsc(String ticketId);
}
