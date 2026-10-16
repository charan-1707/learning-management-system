package com.learnhub.lms.enrollment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

  List<LessonProgress> findByStudent_Id(Long studentId);

  long countByStudent_IdAndLesson_Id(Long studentId, String lessonId);

  Optional<LessonProgress> findByStudent_IdAndLesson_Id(Long studentId, String lessonId);
}
