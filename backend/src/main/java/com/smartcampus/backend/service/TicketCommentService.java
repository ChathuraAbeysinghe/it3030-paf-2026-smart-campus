package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.TicketComment;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.EventType;
import com.smartcampus.backend.model.enums.MessageType;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.TicketCommentRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final TicketNotificationService notificationService;
    private final TicketTimelineService timelineService;

    /**
     * Add a comment to a ticket's conversation thread.
     */
    public TicketComment addComment(String ticketId, User actor, String message,
                                     MessageType messageType) {
        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .senderId(actor.getId())
                .senderName(actor.getName())
                .senderRole(actor.getRole().name())
                .message(message)
                .messageType(messageType)
                .timestamp(Instant.now())
                .build();

        TicketComment saved = commentRepository.save(comment);

        // Record in timeline (except SYSTEM messages, those are already recorded)
        if (messageType != MessageType.SYSTEM) {
            timelineService.record(ticketId, actor.getId(), actor.getName(),
                    actor.getRole().name(), EventType.COMMENTED,
                    actor.getName() + " added a comment",
                    Map.of("messageType", messageType.name()));

            notifyParticipantsOnComment(ticketId, actor, message);
        }

        return saved;
    }

    private void notifyParticipantsOnComment(String ticketId, User actor, String message) {
        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) {
            return;
        }

        Set<String> recipientIds = new LinkedHashSet<>();

        if (ticket.getCreatedBy() != null && !ticket.getCreatedBy().isBlank()) {
            recipientIds.add(ticket.getCreatedBy());
        }
        if (ticket.getAssignedTechnician() != null && !ticket.getAssignedTechnician().isBlank()) {
            recipientIds.add(ticket.getAssignedTechnician());
        }

        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            if (admin.getId() != null && !admin.getId().isBlank()) {
                recipientIds.add(admin.getId());
            }
        }

        recipientIds.remove(actor.getId());

        if (recipientIds.isEmpty()) {
            return;
        }

        String preview = message == null ? "" : message.trim();
        if (preview.length() > 120) {
            preview = preview.substring(0, 117) + "...";
        }

        String ticketCode = ticket.getTicketId() == null ? "ticket" : ticket.getTicketId();
        String title = "New message on " + ticketCode;
        String body = actor.getName() + ": " + preview;

        for (String recipientId : recipientIds) {
            notificationService.notify(
                    recipientId,
                    "COMMENT_ADDED",
                    title,
                    body,
                    ticket.getId()
            );
        }
    }

    /**
     * Add a system-generated comment.
     */
    public TicketComment addSystemComment(String ticketId, String message) {
        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .senderId("SYSTEM")
                .senderName("System")
                .senderRole("SYSTEM")
                .message(message)
                .messageType(MessageType.SYSTEM)
                .timestamp(Instant.now())
                .build();
        return commentRepository.save(comment);
    }

    /**
     * Get all comments for a ticket.
     */
    public List<TicketComment> getComments(String ticketId) {
        return commentRepository.findByTicketIdOrderByTimestampAsc(ticketId);
    }

    /**
     * Edit own comment (owner only).
     */
    public TicketComment editComment(String commentId, User actor, String newMessage) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getSenderId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own comments");
        }
        if (comment.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot edit deleted comment");
        }

        comment.setMessage(newMessage);
        comment.setEdited(true);
        comment.setEditedAt(Instant.now());
        return commentRepository.save(comment);
    }

    /**
     * Soft-delete own comment (owner only).
     */
    public void deleteComment(String commentId, User actor) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getSenderId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own comments");
        }

        comment.setDeleted(true);
        comment.setMessage("[This message has been deleted]");
        commentRepository.save(comment);
    }
}
