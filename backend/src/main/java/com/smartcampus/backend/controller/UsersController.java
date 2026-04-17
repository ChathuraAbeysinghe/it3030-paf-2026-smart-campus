package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, String>> users = userRepository.findAll().stream()
                .map(this::toUserSummary)
                .toList();
        return ResponseEntity.ok(users);
    }

    private Map<String, String> toUserSummary(User user) {
        return Map.of(
                "id", user.getId(),
                "name", user.getName() != null ? user.getName() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "role", user.getRole() != null ? user.getRole().name() : "USER"
        );
    }
}
