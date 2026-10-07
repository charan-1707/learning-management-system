package com.learnhub.lms.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, String> {

  List<Assignment> findByCourse_Id(String courseId);
}
