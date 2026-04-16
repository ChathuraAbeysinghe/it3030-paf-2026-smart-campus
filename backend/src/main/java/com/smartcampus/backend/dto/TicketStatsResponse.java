package com.smartcampus.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketStatsResponse {
    private long open;
    private long inProgress;
    private long waitingConfirmation;
    private long onHold;
    private long slaBreached;
    private long resolvedToday;
    private long closedTotal;
    private long totalTickets;
}
