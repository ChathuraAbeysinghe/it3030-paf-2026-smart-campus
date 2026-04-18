package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.enums.SlaStatus;
import com.smartcampus.backend.model.enums.TicketPriority;
import com.smartcampus.backend.model.enums.TicketStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class SlaService {

    /**
     * Calculate SLA deadline based on priority.
     * CRITICAL=2h, HIGH=4h, MEDIUM=12h, LOW=24h
     */
    public Instant calculateDeadline(TicketPriority priority, Instant createdAt) {
        int hours = switch (priority) {
            case CRITICAL -> 2;
            case HIGH -> 4;
            case MEDIUM -> 12;
            case LOW -> 24;
        };
        return createdAt.plus(hours, ChronoUnit.HOURS);
    }

    /**
     * Evaluate current SLA status for a ticket.
     */
    public SlaStatus evaluateSla(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.ON_HOLD) {
            return SlaStatus.PAUSED;
        }
        // Terminal states — no SLA tracking needed
        if (ticket.getStatus() == TicketStatus.CLOSED ||
            ticket.getStatus() == TicketStatus.REJECTED ||
            ticket.getStatus() == TicketStatus.RESOLVED) {
            return ticket.getSlaStatus(); // preserve last known status
        }

        Instant now = Instant.now();
        Instant deadline = ticket.getSlaDeadline();
        if (deadline == null) return SlaStatus.WITHIN_SLA;

        long totalSeconds = ChronoUnit.SECONDS.between(ticket.getCreatedAt(), deadline);
        if (totalSeconds <= 0) return SlaStatus.BREACHED;

        long elapsed = ChronoUnit.SECONDS.between(ticket.getCreatedAt(), now)
                       - ticket.getTotalPausedDuration();
        double percent = (double) elapsed / totalSeconds;

        if (elapsed >= totalSeconds) return SlaStatus.BREACHED;
        if (percent >= 0.75) return SlaStatus.AT_RISK;
        return SlaStatus.WITHIN_SLA;
    }

    /**
     * Pause SLA when ticket goes ON_HOLD.
     */
    public void pauseSla(Ticket ticket) {
        ticket.setSlaPausedAt(Instant.now());
        ticket.setSlaStatus(SlaStatus.PAUSED);
    }

    /**
     * Resume SLA when ticket leaves ON_HOLD.
     */
    public void resumeSla(Ticket ticket) {
        if (ticket.getSlaPausedAt() != null) {
            long pausedSeconds = ChronoUnit.SECONDS.between(ticket.getSlaPausedAt(), Instant.now());
            ticket.setTotalPausedDuration(ticket.getTotalPausedDuration() + pausedSeconds);
            ticket.setSlaPausedAt(null);
        }
        // Re-evaluate after resume
        ticket.setSlaStatus(evaluateSla(ticket));
    }
}
