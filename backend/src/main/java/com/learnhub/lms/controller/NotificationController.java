package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.NotificationRequest;
import com.learnhub.lms.dto.response.NotificationResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/api/users/{userId}/notifications")
    public List<NotificationResponse> getForUser(@PathVariable Long userId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            userId = principal.getId();
        }
        return notificationService.getNotificationsForUser(userId);
    }

    @GetMapping("/api/users/{userId}/notifications/unread-count")
    public long getUnreadCount(@PathVariable Long userId,
                               @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            userId = principal.getId();
        }
        return notificationService.getUnreadCount(userId);
    }

    @PostMapping("/api/notifications")
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request));
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markRead(id, principal.getId());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/api/notifications/users/{userId}/read-all")
    public ResponseEntity<Void> markAllRead(@PathVariable Long userId,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            userId = principal.getId();
        }
        notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }
}