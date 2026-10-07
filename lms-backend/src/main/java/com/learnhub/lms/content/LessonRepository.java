package com.learnhub.lms.content;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, String> {

  List<Lesson> findByModule_IdOrderByOrderIndexAsc(String moduleId);

  long countByModule_Id(String moduleId);

  List<Lesson> findByModule_Course_Id(String courseId);
}
