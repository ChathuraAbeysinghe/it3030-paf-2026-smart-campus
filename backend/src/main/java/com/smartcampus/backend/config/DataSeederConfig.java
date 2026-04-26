package com.smartcampus.backend.config;

import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeederConfig {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDefaultAdmin() {
        return args -> {
            String adminEmail = "admin@sliit.lk";
            if (userRepository.findByEmailIgnoreCase(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .name("Admin User")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("admin@123"))
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
            }
        };
    }
}
