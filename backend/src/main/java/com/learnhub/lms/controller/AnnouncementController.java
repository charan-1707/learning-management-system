package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.AnnouncementRequest;
import com.learnhub.lms.dto.response.AnnouncementResponse;
import com.learnhub.lms.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping("/api/courses/{courseId}/announcements")
    public List<AnnouncementResponse> getByCourse(@PathVariable Long courseId) {
        return announcementService.getAnnouncementsForCourse(courseId);
    }

    @PostMapping("/api/announcements")
    public ResponseEntity<AnnouncementResponse> create(@Valid @RequestBody AnnouncementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(announcementService.createAnnouncement(request));
    }

    @DeleteMapping("/api/announcements/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.noContent().build();
    }
}