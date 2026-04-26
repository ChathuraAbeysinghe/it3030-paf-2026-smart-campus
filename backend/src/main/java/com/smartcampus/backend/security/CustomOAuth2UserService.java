package com.smartcampus.backend.security;

import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.admin-emails:}")
    private String adminEmailsConfig;

    private static final Pattern SLIIT_EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+\\-]+@(my\\.)?sliit\\.lk$", Pattern.CASE_INSENSITIVE);

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email;
        String name;
        String picture;

        if ("github".equals(registrationId)) {
            // GitHub: 'name' may be null if not set on the profile — fall back to 'login'
            name    = attributes.get("name") != null
                      ? (String) attributes.get("name")
                      : (String) attributes.get("login");
            picture = (String) attributes.get("avatar_url");

            // Fetch ALL emails from GitHub and pick the SLIIT one
            String accessToken = userRequest.getAccessToken().getTokenValue();
            email = resolveSliitEmailFromGitHub(accessToken, (String) attributes.get("email"));

        } else {
            // Google (and any other future provider) — standard attributes
            email   = (String) attributes.get("email");
            name    = (String) attributes.get("name");
            picture = (String) attributes.get("picture");
        }

        String normalizedEmail = (email == null) ? null : email.trim().toLowerCase();

        // ── SLIIT Campus Email Validation ──────────────────────────────────────
        if (normalizedEmail == null || !SLIIT_EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            String hint = "github".equals(registrationId)
                ? "Make sure you have added your @my.sliit.lk email to your GitHub account (Settings → Emails)."
                : "Please use your @my.sliit.lk or @sliit.lk email address.";
            throw new OAuth2AuthenticationException(
                new OAuth2Error("invalid_email", "Access restricted to SLIIT users only", null),
                "Access restricted to SLIIT users only. " + hint
            );
        }

        // ── Admin email list from config ────────────────────────────────────────
        List<String> adminEmails = adminEmailsConfig.isBlank()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));

        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (name != null)    user.setName(name);
            if (picture != null) user.setPicture(picture);
            userRepository.save(user);
        } else {
            Role role = adminEmails.contains(normalizedEmail) ? Role.ADMIN : Role.USER;
            User newUser = User.builder()
                    .name(name)
                    .email(normalizedEmail)
                    .picture(picture)
                    .role(role)
                    .build();
            userRepository.save(newUser);
        }

        Map<String, Object> modifiedAttributes = new java.util.HashMap<>(attributes);
        modifiedAttributes.put("email", normalizedEmail);
        if (name != null) modifiedAttributes.put("name", name);
        if (picture != null) modifiedAttributes.put("picture", picture);

        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        return new org.springframework.security.oauth2.core.user.DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                modifiedAttributes,
                userNameAttributeName
        );
    }

    /**
     * Fetches all emails from the GitHub /user/emails API and returns the first
     * SLIIT-matching email found.
     *
     * Search order:
     *  1. Primary + verified SLIIT email
     *  2. Any verified SLIIT email
     *  3. Any SLIIT email (unverified)
     *  4. Primary verified email (non-SLIIT, will fail validation later)
     *  5. The public email already on the profile (may be null)
     */
    private String resolveSliitEmailFromGitHub(String accessToken, String publicEmail) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Accept", "application/vnd.github.v3+json");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                "https://api.github.com/user/emails",
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<>() {}
            );

            List<Map<String, Object>> emails = response.getBody();
            if (emails == null || emails.isEmpty()) {
                return publicEmail;
            }

            log.debug("GitHub returned {} email(s) for this user", emails.size());

            // 1. Primary + verified SLIIT email
            Optional<String> primarySliit = emails.stream()
                .filter(e -> Boolean.TRUE.equals(e.get("primary"))
                          && Boolean.TRUE.equals(e.get("verified")))
                .map(e -> (String) e.get("email"))
                .filter(e -> SLIIT_EMAIL_PATTERN.matcher(e).matches())
                .findFirst();
            if (primarySliit.isPresent()) return primarySliit.get();

            // 2. Any verified SLIIT email
            Optional<String> verifiedSliit = emails.stream()
                .filter(e -> Boolean.TRUE.equals(e.get("verified")))
                .map(e -> (String) e.get("email"))
                .filter(e -> SLIIT_EMAIL_PATTERN.matcher(e).matches())
                .findFirst();
            if (verifiedSliit.isPresent()) return verifiedSliit.get();

            // 3. Any SLIIT email (even unverified)
            Optional<String> anySliit = emails.stream()
                .map(e -> (String) e.get("email"))
                .filter(e -> e != null && SLIIT_EMAIL_PATTERN.matcher(e).matches())
                .findFirst();
            if (anySliit.isPresent()) return anySliit.get();

            // 4. No SLIIT email found — return the primary verified email (will fail validation)
            return emails.stream()
                .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                .map(e -> (String) e.get("email"))
                .findFirst()
                .orElse(publicEmail);

        } catch (Exception ex) {
            log.warn("Failed to fetch GitHub emails via API: {}", ex.getMessage());
            return publicEmail;
        }
    }
}
