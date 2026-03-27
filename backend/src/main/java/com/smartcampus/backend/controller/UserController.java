package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /**
     * GET /api/user/me
     * Returns the currently authenticated user's profile and role.
     * Supports both OAuth2 sessions and manual-login sessions.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest request) {

        // Try OAuth2 first
        if (principal != null) {
            String email = principal.getAttribute("email");
            Optional<User> userOptional = userRepository.findByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();
            return ResponseEntity.ok(buildUserResponse(user));
        }

        // Fallback: manual login session
        HttpSession session = request.getSession(false);
        if (session != null) {
            String userId = (String) session.getAttribute("manualUserId");
            if (userId != null) {
                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isPresent()) {
                    return ResponseEntity.ok(buildUserResponse(userOptional.get()));
                }
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }

    private Map<String, String> buildUserResponse(User user) {
        return Map.of(
                "id",      user.getId(),
                "name",    user.getName(),
                "email",   user.getEmail(),
                "picture", user.getPicture() != null ? user.getPicture() : "",
                "role",    user.getRole().name()
        );
    }
}
