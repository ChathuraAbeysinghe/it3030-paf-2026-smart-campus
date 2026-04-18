package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CommentRequest;
import com.smartcampus.backend.model.TicketComment;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.service.CurrentUserService;
import com.smartcampus.backend.service.TicketCommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketCommentController {

    private final TicketCommentService commentService;
    private final CurrentUserService currentUserService;

    @GetMapping("/{ticketId}/comments")
    public List<TicketComment> getComments(
            @PathVariable String ticketId,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {
        currentUserService.resolveCurrentUser(principal, httpRequest);
        return commentService.getComments(ticketId);
    }

    @PostMapping("/{ticketId}/comments")
    public TicketComment addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {
        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        com.smartcampus.backend.model.enums.MessageType type = com.smartcampus.backend.model.enums.MessageType.TEXT;
        try {
            if (request.getMessageType() != null) {
                type = com.smartcampus.backend.model.enums.MessageType.valueOf(request.getMessageType());
            }
        } catch (IllegalArgumentException ignored) {}
        
        return commentService.addComment(ticketId, actor, request.getMessage(), type);
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public TicketComment editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {
        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        return commentService.editComment(commentId, actor, request.getMessage());
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {
        User actor = currentUserService.resolveCurrentUser(principal, httpRequest);
        commentService.deleteComment(commentId, actor);
        return ResponseEntity.noContent().build();
    }
}
