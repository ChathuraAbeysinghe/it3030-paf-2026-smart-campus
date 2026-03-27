package com.smartcampus.backend.security;

import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Value("${app.admin-emails:}")
    private String adminEmailsConfig;

    private static final String SLIIT_DOMAIN = "@my.sliit.lk";

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email   = (String) attributes.get("email");
        String name    = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");

        // ── SLIIT Campus Email Validation ──
        if (email == null || !email.toLowerCase().endsWith(SLIIT_DOMAIN)) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("invalid_email", "Access restricted to SLIIT students only", null),
                "Access restricted to SLIIT students only. Please use your @my.sliit.lk email."
            );
        }

        // Admin email list from config
        List<String> adminEmails = adminEmailsConfig.isBlank()
                ? List.of()
                : Arrays.asList(adminEmailsConfig.split(","));

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // Update name/picture in case they changed on Google side
            User user = existingUser.get();
            user.setName(name);
            user.setPicture(picture);
            userRepository.save(user);
        } else {
            // First login — assign role
            Role role = adminEmails.contains(email.trim()) ? Role.ADMIN : Role.USER;

            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .picture(picture)
                    .role(role)
                    .build();
            userRepository.save(newUser);
        }

        return oAuth2User;
    }
}
