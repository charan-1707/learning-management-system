package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.response.AdminDashboardResponse;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.EnrollmentRepository;
import com.learnhub.lms.repository.SubmissionRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public AdminDashboardResponse getStatistics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        return new AdminDashboardResponse(
                totalUsers,
                userRepository.countByRole(UserRole.STUDENT),
                userRepository.countByRole(UserRole.FACULTY),
                courseRepository.count(),
                courseRepository.countByStatus(CourseStatus.PUBLISHED),
                enrollmentRepository.count(),
                submissionRepository.count(),
                submissionRepository.countBySubmittedAtAfter(LocalDate.now().atStartOfDay()),
                activeUsers
        );
    }
}