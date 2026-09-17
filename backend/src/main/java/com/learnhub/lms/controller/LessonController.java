package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.LessonCompleteRequest;
import com.learnhub.lms.dto.request.LessonRequest;
import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.dto.response.LessonResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/api/modules/{moduleId}/lessons")
    public List<LessonResponse> getLessonsForModule(@PathVariable Long moduleId,
                                                    @RequestParam(required = false) Long studentId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null && principal.isStudent()) {
            studentId = principal.getId();
            return lessonService.getLessonsForModule(moduleId, studentId);
        }
        return lessonService.getLessonsForModule(moduleId, studentId);
    }

    @GetMapping("/api/courses/{courseId}/lessons")
    public List<LessonResponse> getLessonsForCourse(@PathVariable Long courseId,
                                                    @RequestParam(required = false) Long studentId,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null && principal.isStudent()) {
            studentId = principal.getId();
        }
        return lessonService.getLessonsForCourse(courseId, studentId);
    }

    @PostMapping("/api/modules/{moduleId}/lessons")
    public ResponseEntity<LessonResponse> createLesson(@PathVariable Long moduleId,
                                                       @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lessonService.createLesson(moduleId, request));
    }

    @PutMapping("/api/modules/{moduleId}/lessons/reorder")
    public List<LessonResponse> reorderLessons(@PathVariable Long moduleId,
                                               @RequestBody List<Long> orderedLessonIds) {
        return lessonService.reorderLessons(moduleId, orderedLessonIds);
    }

    @PutMapping("/api/lessons/{lessonId}")
    public LessonResponse updateLesson(@PathVariable Long lessonId,
                                       @Valid @RequestBody LessonRequest request) {
        return lessonService.updateLesson(lessonId, request);
    }

    @DeleteMapping("/api/lessons/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/lessons/{lessonId}/complete")
    public LessonProgressResponse markComplete(@PathVariable Long lessonId,
                                               @Valid @RequestBody LessonCompleteRequest request,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        request.setStudentId(principal.getId());
        return lessonService.markComplete(lessonId, request);
    }
}