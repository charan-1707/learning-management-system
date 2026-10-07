package com.learnhub.lms.communication;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {

  List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

  long countByUser_IdAndReadFalse(Long userId);
}
