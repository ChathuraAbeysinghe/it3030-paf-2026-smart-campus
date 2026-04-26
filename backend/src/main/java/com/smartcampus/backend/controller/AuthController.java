package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.ChangePasswordRequest;
import com.smartcampus.backend.dto.LoginRequest;
import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtService;
import com.smartcampus.backend.service.LoginAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAuditService loginAuditService;

    @Value("${app.admin-emails:}")
    private String adminEmailsConfig;

    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    /**
     * POST /api/auth/register
     * Creates a new user with BCrypt-hashed password.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Enforce faculty-specific ID prefixes
        Map<String, String> facultyPrefixes = Map.of(
            "COMPUTING", "IT",
            "ENGINEERING", "EN",
            "SLIIT BUSINESS SCHOOL", "BM",
            "HUMANITIES & SCIENCES", "SH",
            "GRADUATE STUDIES", "MS",
            "SCHOOL OF ARCHITECTURE", "AR",
            "SCHOOL OF LAW", "LW",
            "SCHOOL OF HOSPITALITY & CULINARY", "HC",
            "FOUNDATION PROGRAMME", "FO"
        );
        String expectedPrefix = facultyPrefixes.get(request.getFaculty());
        if (expectedPrefix != null && !request.getItNumber().toUpperCase().startsWith(expectedPrefix)) {
            return ResponseEntity.badRequest().body(Map.of("error", "ID prefix must be " + expectedPrefix + " for " + request.getFaculty()));
        }

        // Verify IT Number matches Email
        if (!request.getEmail().toUpperCase().startsWith(request.getItNumber().toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("error", "IT Number does not match the provided campus email."));
        }

        // Check if email already exists
        String emailToRegister = request.getEmail() != null ? request.getEmail().trim() : "";
        if (userRepository.findByEmailIgnoreCase(emailToRegister).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        // Determine role
        List<String> adminEmails = adminEmailsConfig.isBlank()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));
        Role role = adminEmails.contains(request.getEmail().trim()) ? Role.ADMIN : Role.USER;

        User user = User.builder()
                .name(request.getName())
                .itNumber(request.getItNumber().toUpperCase())
                .faculty(request.getFaculty())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "id",    user.getId(),
                "name",  user.getName(),
                "email", user.getEmail(),
                "role",  user.getRole().name()
        ));
    }

    /**
     * POST /api/auth/login
     * Validates email/password credentials and returns user info.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(email);

        if (userOptional.isEmpty()) {
            loginAuditService.logFailed(email, "PASSWORD", "Invalid credentials");
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        User user = userOptional.get();

        // User registered via Google (no password)
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "This account uses Google login. Please use 'Continue with Google'."
            ));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginAuditService.logFailed(request.getEmail(), "PASSWORD", "Invalid credentials");
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        // Store user info in session so /api/user/me-manual works
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("manualUserId", user.getId());

        // Authenticate in Spring Security Context 
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth = 
            new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user.getEmail(), null, java.util.Collections.emptyList()
            );
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
        session.setAttribute(org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, 
            org.springframework.security.core.context.SecurityContextHolder.getContext());

        String token = jwtService.generateToken(user.getEmail());
        loginAuditService.logSuccess(user.getEmail(), user.getRole().name(), "PASSWORD");

        return ResponseEntity.ok(Map.of(
                "id",      user.getId(),
                "name",    user.getName(),
                "email",   user.getEmail(),
                "picture", user.getPicture() != null ? user.getPicture() : "",
            "role",    user.getRole().name(),
            "token",   token
        ));
    }

    /**
     * POST /api/auth/logout
     * Invalidates the current session and clears security context.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            logoutHandler.logout(request, response, auth);
        }
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * POST /api/auth/change-password
     * Changes the password for the currently authenticated user.
     * Supports both OAuth2 and manual login sessions.
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            HttpServletRequest httpRequest) {

        // Get current user email from OAuth2 or session
        String userEmail = null;

        // Try OAuth2 first
        if (principal != null) {
            userEmail = principal.getAttribute("email");
        } else {
            // Fallback: get from manual login session
            HttpSession session = httpRequest.getSession(false);
            if (session != null) {
                String userId = (String) session.getAttribute("manualUserId");
                if (userId != null) {
                    Optional<User> userOptional = userRepository.findById(userId);
                    if (userOptional.isPresent()) {
                        userEmail = userOptional.get().getEmail();
                    }
                }
            }
        }

        // Not authenticated
        if (userEmail == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        // Find user by email
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(userEmail);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOptional.get();

        // Users registered via OAuth2 (no password) cannot change password
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                "error", "This account uses Google login and cannot change password through this endpoint"
            ));
        }

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Current password is incorrect"));
        }

        // Update to new password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
