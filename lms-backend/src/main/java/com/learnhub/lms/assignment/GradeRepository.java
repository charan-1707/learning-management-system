package com.learnhub.lms.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {

  List<Grade> findByStudent_Id(Long studentId);

  List<Grade> findByStudent_IdOrderByGradedAtDesc(Long studentId);

  List<Grade> findByCourse_IdAndStudent_IdAndAssessmentAndType(String courseId, Long studentId,
      String assessment, GradeType type);
}
