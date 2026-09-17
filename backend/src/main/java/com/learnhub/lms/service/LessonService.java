package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.LessonCompleteRequest;
import com.learnhub.lms.dto.request.LessonRequest;
import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.dto.response.LessonResponse;

import java.util.List;

public interface LessonService {

    List<LessonResponse> getLessonsForModule(Long moduleId, Long studentId);

    List<LessonResponse> getLessonsForCourse(Long courseId, Long studentId);

    LessonResponse createLesson(Long moduleId, LessonRequest request);

    LessonResponse updateLesson(Long lessonId, LessonRequest request);

    void deleteLesson(Long lessonId);

    List<LessonResponse> reorderLessons(Long moduleId, List<Long> orderedLessonIds);

    LessonProgressResponse markComplete(Long lessonId, LessonCompleteRequest request);
}