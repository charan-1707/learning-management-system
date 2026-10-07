package com.learnhub.lms.course;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, String> {

  List<Course> findByInstructor_Id(Long instructorId);

  long countByInstructor_Id(Long instructorId);

  Optional<Course> findByThumbnailUrl(String thumbnailUrl);
}
