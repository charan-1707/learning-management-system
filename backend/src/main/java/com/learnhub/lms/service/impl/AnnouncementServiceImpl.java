package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.AnnouncementRequest;
import com.learnhub.lms.dto.response.AnnouncementResponse;
import com.learnhub.lms.entity.Announcement;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.AnnouncementRepository;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncementsForCourse(Long courseId) {
        return mapper.toAnnouncementResponses(
                announcementRepository.findByCourseIdOrderByCreatedAtDesc(courseId));
    }

    @Override
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));
        User faculty = userRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getFacultyId()));
        Announcement announcement = new Announcement();
        announcement.setCourse(course);
        announcement.setFaculty(faculty);
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        return mapper.toAnnouncementResponse(announcementRepository.save(announcement));
    }

    @Override
    public void deleteAnnouncement(Long id) {
        announcementRepository.delete(findOrThrow(id));
    }

    private Announcement findOrThrow(Long id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
    }
}