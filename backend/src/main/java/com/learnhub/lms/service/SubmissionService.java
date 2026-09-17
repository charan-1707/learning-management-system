package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.GradeRequest;
import com.learnhub.lms.dto.request.SubmissionRequest;
import com.learnhub.lms.dto.response.SubmissionResponse;

import java.util.List;

public interface SubmissionService {

    List<SubmissionResponse> getSubmissionsForAssignment(Long assignmentId);

    List<SubmissionResponse> getSubmissionsByStudent(Long studentId);

    SubmissionResponse getSubmission(Long assignmentId, Long studentId);

    SubmissionResponse submit(SubmissionRequest request);

    SubmissionResponse grade(Long submissionId, GradeRequest grading, Long gradedById);
}