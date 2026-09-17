package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.entity.LessonProgress;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.LessonProgressRepository;
import com.learnhub.lms.service.LessonProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final EntityMapper mapper;

    @Override
    public List<LessonProgressResponse> getProgressByStudent(Long studentId) {
        return lessonProgressRepository.findByStudentId(studentId).stream()
                .map(mapper::toLessonProgressResponse)
                .toList();
    }

    @Override
    public LessonProgressResponse getForStudentAndLesson(Long studentId, Long lessonId) {
        LessonProgress progress = lessonProgressRepository
                .findByStudentIdAndLessonId(studentId, lessonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Lesson progress for student " + studentId + " and lesson " + lessonId));
        return mapper.toLessonProgressResponse(progress);
    }
}