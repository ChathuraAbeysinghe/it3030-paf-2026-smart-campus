package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.LoginAuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAuditRepository 
    extends MongoRepository<LoginAuditLog, String> {

    List<LoginAuditLog> findAllByOrderByCreatedAtDesc();

    List<LoginAuditLog> findByCreatedAtAfterOrderByCreatedAtDesc(
        LocalDateTime after
    );
}
