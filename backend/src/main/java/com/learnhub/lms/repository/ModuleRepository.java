package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {

    List<Module> findByCourseIdOrderByDisplayOrderAsc(Long courseId);

    List<Module> findByCourseId(Long courseId);
}