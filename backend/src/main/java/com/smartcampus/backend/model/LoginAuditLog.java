package com.smartcampus.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "login_audit_log")
@Data
public class LoginAuditLog {

    @Id
    private String id;

    private String email;
    private String role;
    private String method;   // "PASSWORD" or "GOOGLE"
    private String status;   // "SUCCESS" or "FAILED"
    private String reason;   // null if success, message if failed

    private LocalDateTime createdAt;

    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
