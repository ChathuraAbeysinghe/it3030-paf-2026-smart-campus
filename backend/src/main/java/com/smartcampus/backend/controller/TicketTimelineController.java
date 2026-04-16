package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.TicketTimeline;
import com.smartcampus.backend.service.CurrentUserService;
import com.smartcampus.backend.service.TicketTimelineService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketTimelineController {

    private final TicketTimelineService timelineService;
    private final CurrentUserService currentUserService;

    @GetMapping("/{ticketId}/timeline")
    public List<TicketTimeline> getTimeline(
            @PathVariable String ticketId,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {
        currentUserService.resolveCurrentUser(principal, httpRequest);
        return timelineService.getTimeline(ticketId);
    }
}
