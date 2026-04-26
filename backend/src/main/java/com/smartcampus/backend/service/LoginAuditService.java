package com.smartcampus.backend.service;

import com.smartcampus.backend.model.LoginAuditLog;
import com.smartcampus.backend.repository.LoginAuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LoginAuditService {

    @Autowired
    private LoginAuditRepository loginAuditRepository;

    public void logSuccess(String email, String role, String method) {
        LoginAuditLog log = new LoginAuditLog();
        log.setEmail(email);
        log.setRole(role);
        log.setMethod(method);
        log.setStatus("SUCCESS");
        log.setReason(null);
        loginAuditRepository.save(log);
    }

    public void logFailed(String email, String method, String reason) {
        LoginAuditLog log = new LoginAuditLog();
        log.setEmail(email);
        log.setRole("UNKNOWN");
        log.setMethod(method);
        log.setStatus("FAILED");
        log.setReason(reason);
        loginAuditRepository.save(log);
    }

    public List<LoginAuditLog> getRecentLogs() {
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        return loginAuditRepository
            .findByCreatedAtAfterOrderByCreatedAtDesc(last24Hours);
    }

    public List<LoginAuditLog> getAllLogs() {
        return loginAuditRepository.findAllByOrderByCreatedAtDesc();
    }
}
