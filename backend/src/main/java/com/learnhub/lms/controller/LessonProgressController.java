package com.learnhub.lms.controller;

import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.LessonProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class LessonProgressController {

    private final LessonProgressService lessonProgressService;

    @GetMapping("/student/{studentId}")
    public List<LessonProgressResponse> getProgressByStudent(@PathVariable Long studentId,
                                                             @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return lessonProgressService.getProgressByStudent(studentId);
    }

    @GetMapping
    public LessonProgressResponse getForStudentAndLesson(@RequestParam Long studentId,
                                                         @RequestParam Long lessonId,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return lessonProgressService.getForStudentAndLesson(studentId, lessonId);
    }
}