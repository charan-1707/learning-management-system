package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByAssignmentId(Long assignmentId);

    List<Submission> findByStudentId(Long studentId);

    Optional<Submission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    long countBySubmittedAtAfter(LocalDateTime time);

    @Modifying
    @Query("DELETE FROM Submission s WHERE s.assignment.id IN :assignmentIds")
    void deleteByAssignmentIdsIn(@Param("assignmentIds") Collection<Long> assignmentIds);
}