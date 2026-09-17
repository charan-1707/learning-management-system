package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.AnnouncementRequest;
import com.learnhub.lms.dto.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {

    List<AnnouncementResponse> getAnnouncementsForCourse(Long courseId);

    AnnouncementResponse createAnnouncement(AnnouncementRequest request);

    void deleteAnnouncement(Long id);
}