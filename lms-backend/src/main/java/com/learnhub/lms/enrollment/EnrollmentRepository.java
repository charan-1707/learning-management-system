package com.learnhub.lms.enrollment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

  long countByStudent_Id(Long studentId);

  long countByCourse_Id(String courseId);

  boolean existsByStudent_IdAndCourse_Id(Long studentId, String courseId);

  List<Enrollment> findByCourse_Id(String courseId);

  List<Enrollment> findByStudent_Id(Long studentId);

  Optional<Enrollment> findByStudent_IdAndCourse_Id(Long studentId, String courseId);

  /** Distinct learners across every course owned by one faculty (directory stat). */
  @Query("SELECT COUNT(DISTINCT e.student.id) FROM Enrollment e WHERE e.course.instructor.id = :facultyId")
  long countDistinctStudentsByInstructor(@Param("facultyId") Long facultyId);
}
