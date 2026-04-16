package com.smartcampus.backend.service;

import com.smartcampus.backend.model.TicketTimeline;
import com.smartcampus.backend.model.enums.EventType;
import com.smartcampus.backend.repository.TicketTimelineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TicketTimelineService {

    private final TicketTimelineRepository timelineRepository;

    /**
     * Record a timeline event for audit trail.
     */
    public void record(String ticketId, String actorId, String actorName,
                       String actorRole, EventType type, String description,
                       Map<String, Object> metadata) {
        TicketTimeline event = TicketTimeline.builder()
                .ticketId(ticketId)
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(actorRole)
                .eventType(type)
                .description(description)
                .metadata(metadata != null ? metadata : Map.of())
                .timestamp(Instant.now())
                .build();
        timelineRepository.save(event);
    }

    /**
     * Get full timeline for a ticket.
     */
    public List<TicketTimeline> getTimeline(String ticketId) {
        return timelineRepository.findByTicketIdOrderByTimestampAsc(ticketId);
    }
}
