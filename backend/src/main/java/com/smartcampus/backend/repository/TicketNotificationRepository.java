package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.TicketNotification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketNotificationRepository extends MongoRepository<TicketNotification, String> {

    List<TicketNotification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    List<TicketNotification> findByRecipientIdAndIsReadFalse(String recipientId);

    long countByRecipientIdAndIsReadFalse(String recipientId);
}
