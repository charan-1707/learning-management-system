package com.learnhub.lms.service;

import com.learnhub.lms.dto.response.LessonProgressResponse;

import java.util.List;

public interface LessonProgressService {

    List<LessonProgressResponse> getProgressByStudent(Long studentId);

    LessonProgressResponse getForStudentAndLesson(Long studentId, Long lessonId);
}