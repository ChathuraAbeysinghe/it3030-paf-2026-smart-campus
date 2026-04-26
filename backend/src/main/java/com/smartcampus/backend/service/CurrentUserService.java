package com.smartcampus.backend.service;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User resolveCurrentUser(OAuth2User principal, HttpServletRequest request) {
        if (principal != null) {
            String email = principal.getAttribute("email");
            if (email != null) {
                return userRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
            }
        }

        HttpSession session = request.getSession(false);
        if (session != null) {
            String userId = (String) session.getAttribute("manualUserId");
            if (userId != null) {
                return userRepository.findById(userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
            }
        }

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            if (email != null && !"anonymousUser".equalsIgnoreCase(email)) {
                return userRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
            }
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
}
