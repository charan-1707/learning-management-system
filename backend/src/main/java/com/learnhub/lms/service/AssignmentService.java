package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.AssignmentRequest;
import com.learnhub.lms.dto.response.AssignmentResponse;

import java.util.List;

public interface AssignmentService {

    List<AssignmentResponse> getAssignmentsForCourse(Long courseId);

    AssignmentResponse getAssignmentById(Long id);

    AssignmentResponse createAssignment(Long courseId, AssignmentRequest request);

    AssignmentResponse updateAssignment(Long assignmentId, AssignmentRequest request);

    void deleteAssignment(Long assignmentId);
}