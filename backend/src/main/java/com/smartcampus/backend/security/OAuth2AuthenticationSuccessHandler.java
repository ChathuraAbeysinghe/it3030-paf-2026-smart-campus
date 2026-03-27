package com.smartcampus.backend.security;

import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        Optional<User> userOptional = userRepository.findByEmail(email);
        String targetUrl;

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            targetUrl = switch (user.getRole()) {
                case ADMIN       -> frontendUrl + "/oauth-callback?role=ADMIN";
                case TECHNICIAN  -> frontendUrl + "/oauth-callback?role=TECHNICIAN";
                default          -> frontendUrl + "/oauth-callback?role=USER";
            };
        } else {
            targetUrl = frontendUrl + "/oauth-callback?role=USER";
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
