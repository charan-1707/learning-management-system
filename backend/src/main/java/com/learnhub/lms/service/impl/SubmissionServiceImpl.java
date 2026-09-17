package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.GradeRequest;
import com.learnhub.lms.dto.request.SubmissionRequest;
import com.learnhub.lms.dto.response.SubmissionResponse;
import com.learnhub.lms.entity.Assignment;
import com.learnhub.lms.entity.Submission;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.SubmissionStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.AssignmentRepository;
import com.learnhub.lms.repository.SubmissionRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForAssignment(Long assignmentId) {
        return mapper.toSubmissionResponses(submissionRepository.findByAssignmentId(assignmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByStudent(Long studentId) {
        return mapper.toSubmissionResponses(submissionRepository.findByStudentId(studentId));
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(Long assignmentId, Long studentId) {
        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Submission for assignment " + assignmentId + " and student " + studentId));
        return mapper.toSubmissionResponse(submission);
    }

    @Override
    public SubmissionResponse submit(SubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", request.getAssignmentId()));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));
        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessRuleException("Only students can submit assignments.");
        }
        if (assignment.getDueDate().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("The submission deadline has passed.");
        }

        Submission submission = submissionRepository
                .findByAssignmentIdAndStudentId(request.getAssignmentId(), request.getStudentId())
                .orElseGet(() -> {
                    Submission s = new Submission();
                    s.setAssignment(assignment);
                    s.setStudent(student);
                    return s;
                });

        submission.setFileName(request.getFileName());
        submission.setFileUrl(request.getFileUrl());
        submission.setStatus(SubmissionStatus.SUBMITTED);
        return mapper.toSubmissionResponse(submissionRepository.save(submission));
    }

    @Override
    public SubmissionResponse grade(Long submissionId, GradeRequest grading, Long gradedById) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));
        if (gradedById != null) {
            User grader = userRepository.findById(gradedById)
                    .orElseThrow(() -> new ResourceNotFoundException("User", gradedById));
            if (grader.getRole() != UserRole.FACULTY && grader.getRole() != UserRole.ADMIN) {
                throw new BusinessRuleException("Only faculty or admin can grade submissions.");
            }
            submission.setGradedBy(grader);
        }
        BigDecimal maxMarks = submission.getAssignment().getMaxMarks();
        if (grading.getScore().compareTo(maxMarks) > 0) {
            throw new BusinessRuleException("Score cannot exceed the maximum marks of " + maxMarks + ".");
        }
        submission.setScore(grading.getScore());
        submission.setFeedback(grading.getFeedback());
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setGradedAt(LocalDateTime.now());
        return mapper.toSubmissionResponse(submissionRepository.save(submission));
    }
}