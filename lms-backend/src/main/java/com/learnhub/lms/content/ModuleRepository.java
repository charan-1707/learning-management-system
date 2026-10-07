package com.learnhub.lms.content;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, String> {

  List<Module> findByCourse_IdOrderByOrderIndexAsc(String courseId);

  long countByCourse_Id(String courseId);
}
