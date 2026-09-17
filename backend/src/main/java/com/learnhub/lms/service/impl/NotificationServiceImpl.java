package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.NotificationRequest;
import com.learnhub.lms.dto.response.NotificationResponse;
import com.learnhub.lms.entity.Notification;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.NotificationRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return mapper.toNotificationResponses(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUserId()));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        if (request.getType() != null) {
            notification.setType(request.getType());
        }
        return mapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Override
    public void markRead(Long id, Long currentUserId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        if (currentUserId != null && !notification.getUser().getId().equals(currentUserId)) {
            throw new BusinessRuleException("You can only mark your own notifications as read.");
        }
        notification.setRead(true);
    }

    @Override
    public void markAllRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .forEach(n -> n.setRead(true));
    }
}