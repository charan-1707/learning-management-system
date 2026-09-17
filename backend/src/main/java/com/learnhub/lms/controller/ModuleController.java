package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.ModuleRequest;
import com.learnhub.lms.dto.response.ModuleResponse;
import com.learnhub.lms.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping("/api/courses/{courseId}/modules")
    public List<ModuleResponse> getModules(@PathVariable Long courseId) {
        return moduleService.getModulesForCourse(courseId);
    }

    @PostMapping("/api/courses/{courseId}/modules")
    public ResponseEntity<ModuleResponse> createModule(@PathVariable Long courseId,
                                                       @Valid @RequestBody ModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moduleService.createModule(courseId, request));
    }

    @PutMapping("/api/courses/{courseId}/modules/reorder")
    public List<ModuleResponse> reorderModules(@PathVariable Long courseId,
                                               @RequestBody List<Long> orderedModuleIds) {
        return moduleService.reorderModules(courseId, orderedModuleIds);
    }

    @PutMapping("/api/modules/{moduleId}")
    public ModuleResponse updateModule(@PathVariable Long moduleId,
                                       @Valid @RequestBody ModuleRequest request) {
        return moduleService.updateModule(moduleId, request);
    }

    @DeleteMapping("/api/modules/{moduleId}")
    public ResponseEntity<Void> deleteModule(@PathVariable Long moduleId) {
        moduleService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }
}