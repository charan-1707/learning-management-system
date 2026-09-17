package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.AssignmentRequest;
import com.learnhub.lms.dto.response.AssignmentResponse;
import com.learnhub.lms.entity.Assignment;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.AssignmentRepository;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.SubmissionRepository;
import com.learnhub.lms.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final SubmissionRepository submissionRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForCourse(Long courseId) {
        return mapper.toAssignmentResponses(assignmentRepository.findByCourseId(courseId));
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentResponse getAssignmentById(Long id) {
        return mapper.toAssignmentResponse(findOrThrow(id));
    }

    @Override
    public AssignmentResponse createAssignment(Long courseId, AssignmentRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        Assignment assignment = new Assignment();
        assignment.setCourse(course);
        applyRequest(assignment, request);
        return mapper.toAssignmentResponse(assignmentRepository.save(assignment));
    }

    @Override
    public AssignmentResponse updateAssignment(Long assignmentId, AssignmentRequest request) {
        Assignment assignment = findOrThrow(assignmentId);
        applyRequest(assignment, request);
        return mapper.toAssignmentResponse(assignmentRepository.save(assignment));
    }

    @Override
    public void deleteAssignment(Long assignmentId) {
        Assignment assignment = findOrThrow(assignmentId);
        submissionRepository.deleteAll(submissionRepository.findByAssignmentId(assignmentId));
        assignmentRepository.delete(assignment);
    }

    private void applyRequest(Assignment assignment, AssignmentRequest request) {
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());
        if (request.getStatus() != null) {
            assignment.setStatus(request.getStatus());
        }
    }

    private Assignment findOrThrow(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
    }
}