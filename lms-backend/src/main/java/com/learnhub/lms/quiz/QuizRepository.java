package com.learnhub.lms.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, String> {

  List<Quiz> findByCourse_Id(String courseId);
}
