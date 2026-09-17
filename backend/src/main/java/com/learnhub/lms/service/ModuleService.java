package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.ModuleRequest;
import com.learnhub.lms.dto.response.ModuleResponse;

import java.util.List;

public interface ModuleService {

    List<ModuleResponse> getModulesForCourse(Long courseId);

    ModuleResponse createModule(Long courseId, ModuleRequest request);

    ModuleResponse updateModule(Long moduleId, ModuleRequest request);

    void deleteModule(Long moduleId);

    List<ModuleResponse> reorderModules(Long courseId, List<Long> orderedModuleIds);
}