package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.EnrollmentRequest;
import com.learnhub.lms.dto.response.EnrollmentResponse;

import java.math.BigDecimal;
import java.util.List;

public interface EnrollmentService {

    EnrollmentResponse enroll(EnrollmentRequest request);

    List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId);

    List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId);

    EnrollmentResponse getEnrollment(Long studentId, Long courseId);

    BigDecimal getProgress(Long studentId, Long courseId);

    void deleteEnrollment(Long id);

    /** Recomputes enrollment progress from completed lessons / total lessons. */
    void recalculateProgress(Long studentId, Long courseId);
}