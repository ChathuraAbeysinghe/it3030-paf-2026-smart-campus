package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ResourceRequest;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;
    private final UserRepository userRepository;

    @GetMapping
    public List<Resource> getAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer maxCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        return resourceService.findAllFiltered(type, minCapacity, maxCapacity, location, status, search);
    }

    @GetMapping("/{id}")
    public Resource getById(@PathVariable String id) {
        return resourceService.getByIdOrThrow(id);
    }

    @PostMapping
    public ResponseEntity<Resource> create(@Valid @RequestBody ResourceRequest body) {
        ensureAdmin();
        Resource created = resourceService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public Resource update(@PathVariable String id, @Valid @RequestBody ResourceRequest body) {
        ensureAdmin();
        return resourceService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        ensureAdmin();
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public Resource updateStatus(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body) {
        ensureAdmin();

        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status is required"
            );
        }

        return resourceService.updateStatus(id, statusStr);
    }

    private void ensureAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        String email = extractEmail(authentication);
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        Optional<User> user = userRepository.findByEmailIgnoreCase(email);
        if (user.isEmpty() || user.get().getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private String extractEmail(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof String value) {
            return value;
        }
        if (principal instanceof OAuth2User oauth2User) {
            Object email = oauth2User.getAttributes().get("email");
            return email == null ? null : String.valueOf(email);
        }

        String name = authentication.getName();
        if (name == null || name.isBlank() || "anonymousUser".equalsIgnoreCase(name)) {
            return null;
        }
        return name;
    }
}