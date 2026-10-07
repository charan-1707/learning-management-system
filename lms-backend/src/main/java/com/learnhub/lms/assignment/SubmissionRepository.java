package com.learnhub.lms.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, String> {

  List<Submission> findByAssignment_IdOrderBySubmittedAtDesc(String assignmentId);

  List<Submission> findByCourse_Id(String courseId);

  List<Submission> findByStudent_Id(Long studentId);

  List<Submission> findBySubmittedAtAfter(java.time.LocalDateTime since);

  Optional<Submission> findByAssignment_IdAndStudent_Id(String assignmentId, Long studentId);
}
