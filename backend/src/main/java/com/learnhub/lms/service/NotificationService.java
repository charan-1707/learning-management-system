package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.NotificationRequest;
import com.learnhub.lms.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getNotificationsForUser(Long userId);

    long getUnreadCount(Long userId);

    NotificationResponse createNotification(NotificationRequest request);

    /**
     * Marks a notification read, but only if it belongs to {@code currentUserId}.
     * Pass {@code null} to skip the ownership check.
     */
    void markRead(Long id, Long currentUserId);

    void markAllRead(Long userId);
}