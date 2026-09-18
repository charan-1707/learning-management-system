package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Course;
import com.learnhub.lms.enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findByFacultyIdOrderByUpdatedAtDesc(Long facultyId);

    List<Course> findByStatus(CourseStatus status);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    long countByStatus(CourseStatus status);
}