package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.TicketNotification;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.CurrentUserService;
import com.smartcampus.backend.service.TicketNotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final TicketNotificationService ticketNotificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(value = "role", required = false) String role,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request
    ) {
        try {
            if (role == null || role.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
            }

            User currentUser = currentUserService.resolveCurrentUser(principal, request);
            if (currentUser.getRole() == null || !currentUser.getRole().name().equalsIgnoreCase(role)) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<TicketNotification> notifications = ticketNotificationService.getByRecipient(currentUser.getId());
            List<Map<String, Object>> payload = (notifications == null ? List.<TicketNotification>of() : notifications)
                    .stream()
                    .map(this::toResponse)
                    .toList();

            return ResponseEntity.ok(payload);
        } catch (ResponseStatusException error) {
            String message = error.getReason() == null ? "Request failed" : error.getReason();
            return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", message));
        } catch (Exception error) {
            System.err.println("Notifications error: " + error.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", error.getMessage() == null ? "Unexpected notifications error" : error.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request
    ) {
        try {
            User currentUser = currentUserService.resolveCurrentUser(principal, request);
            ticketNotificationService.markAsReadForRecipient(id, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (ResponseStatusException error) {
            String message = error.getReason() == null ? "Request failed" : error.getReason();
            return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", message));
        } catch (Exception error) {
            System.err.println("Notifications error: " + error.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", error.getMessage() == null ? "Unexpected notifications error" : error.getMessage()
            ));
        }
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request
    ) {
        try {
            User currentUser = currentUserService.resolveCurrentUser(principal, request);
            String role = body == null ? null : body.get("role");
            if (role != null && currentUser.getRole() != null && !currentUser.getRole().name().equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body(Map.of("message", "Role mismatch"));
            }

            ticketNotificationService.markAllAsRead(currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (ResponseStatusException error) {
            String message = error.getReason() == null ? "Request failed" : error.getReason();
            return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", message));
        } catch (Exception error) {
            System.err.println("Notifications error: " + error.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", error.getMessage() == null ? "Unexpected notifications error" : error.getMessage()
            ));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearAll(
            @RequestParam(value = "role", required = false) String role,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request
    ) {
        try {
            User currentUser = currentUserService.resolveCurrentUser(principal, request);
            if (role != null && currentUser.getRole() != null && !currentUser.getRole().name().equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body(Map.of("message", "Role mismatch"));
            }

            ticketNotificationService.clearAllForRecipient(currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Notifications cleared"));
        } catch (ResponseStatusException error) {
            String message = error.getReason() == null ? "Request failed" : error.getReason();
            return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", message));
        } catch (Exception error) {
            System.err.println("Notifications error: " + error.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", error.getMessage() == null ? "Unexpected notifications error" : error.getMessage()
            ));
        }
    }

    private Map<String, Object> toResponse(TicketNotification notification) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", notification.getId());
        payload.put("type", notification.getType() == null ? "SYSTEM" : notification.getType());
        payload.put("title", notification.getTitle() == null ? "Notification" : notification.getTitle());
        payload.put("message", notification.getMessage() == null ? "" : notification.getMessage());
        payload.put("relatedTicketId", notification.getRelatedTicketId() == null ? "" : notification.getRelatedTicketId());
        payload.put("createdAt", notification.getCreatedAt() == null ? "" : notification.getCreatedAt());
        payload.put("read", notification.isRead());
        return payload;
    }
}
