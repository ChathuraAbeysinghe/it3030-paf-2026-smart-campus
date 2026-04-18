package com.smartcampus.backend.service;

import com.smartcampus.backend.model.TicketNotification;
import com.smartcampus.backend.repository.TicketNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketNotificationService {

    private final TicketNotificationRepository notificationRepository;

    /**
     * Create and store a notification.
     */
    public void notify(String recipientId, String type, String title,
                       String message, String relatedTicketId) {
        TicketNotification notification = TicketNotification.builder()
                .recipientId(recipientId)
                .type(type)
                .title(title)
                .message(message)
                .relatedTicketId(relatedTicketId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(notification);
    }

    /**
     * Get all notifications for a user.
     */
    public List<TicketNotification> getByRecipient(String recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    /**
     * Get unread notifications for a user.
     */
    public List<TicketNotification> getUnread(String recipientId) {
        return notificationRepository.findByRecipientIdAndIsReadFalse(recipientId);
    }

    /**
     * Get unread count.
     */
    public long getUnreadCount(String recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    /**
     * Mark a notification as read.
     */
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * Mark a notification as read only if it belongs to the recipient.
     */
    public void markAsReadForRecipient(String notificationId, String recipientId) {
        TicketNotification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, recipientId)
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "Notification not found"
                ));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Mark all notifications for user as read.
     */
    public void markAllAsRead(String recipientId) {
        List<TicketNotification> unread = notificationRepository
                .findByRecipientIdAndIsReadFalse(recipientId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    /**
     * Delete all notifications for a user.
     */
    public void clearAllForRecipient(String recipientId) {
        notificationRepository.deleteByRecipientId(recipientId);
    }
}
