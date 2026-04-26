package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.LoginAuditLog;
import com.smartcampus.backend.service.LoginAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/auth/admin")
@CrossOrigin
public class LoginAuditController {

    @Autowired
    private LoginAuditService loginAuditService;

    @GetMapping("/login-audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginAuditLog>> getLoginAudit() {
        return ResponseEntity.ok(loginAuditService.getRecentLogs());
    }

    @GetMapping("/login-audit/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginAuditLog>> getAllLoginAudit() {
        return ResponseEntity.ok(loginAuditService.getAllLogs());
    }
}
