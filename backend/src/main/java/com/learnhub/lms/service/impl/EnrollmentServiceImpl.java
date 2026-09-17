package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.EnrollmentRequest;
import com.learnhub.lms.dto.response.EnrollmentResponse;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Enrollment;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.EnrollmentStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.DuplicateResourceException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.EnrollmentRepository;
import com.learnhub.lms.repository.LessonProgressRepository;
import com.learnhub.lms.repository.LessonRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EntityMapper mapper;

    @Override
    public EnrollmentResponse enroll(EnrollmentRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));
        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessRuleException("Only students can enroll in courses.");
        }
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new BusinessRuleException("Cannot enroll in a course that is not published.");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())) {
            throw new DuplicateResourceException("Student is already enrolled in this course.");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setProgress(BigDecimal.ZERO);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        return mapper.toEnrollmentResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId) {
        return mapper.toEnrollmentResponses(enrollmentRepository.findByStudentId(studentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId) {
        return mapper.toEnrollmentResponses(enrollmentRepository.findByCourseId(courseId));
    }

    @Override
    @Transactional(readOnly = true)
    public EnrollmentResponse getEnrollment(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Enrollment for student " + studentId + " and course " + courseId));
        return mapper.toEnrollmentResponse(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getProgress(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .map(Enrollment::getProgress)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public void deleteEnrollment(Long id) {
        enrollmentRepository.delete(findOrThrow(id));
    }

    @Override
    public void recalculateProgress(Long studentId, Long courseId) {
        enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId).ifPresent(enrollment -> {
            long total = lessonRepository.findByModuleCourseId(courseId).size();
            long completed = lessonProgressRepository
                    .findByStudentIdAndLessonModuleCourseId(studentId, courseId).stream()
                    .filter(com.learnhub.lms.entity.LessonProgress::isCompleted)
                    .count();
            BigDecimal progress = total == 0
                    ? BigDecimal.ZERO
                    : BigDecimal.valueOf(completed * 100.0 / total).setScale(2, RoundingMode.HALF_UP);

            enrollment.setProgress(progress);
            if (progress.compareTo(BigDecimal.valueOf(100)) >= 0) {
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                enrollment.setCompletedAt(java.time.LocalDateTime.now());
            } else if (enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
                enrollment.setStatus(EnrollmentStatus.ACTIVE);
                enrollment.setCompletedAt(null);
            }
        });
    }

    private Enrollment findOrThrow(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));
    }
}