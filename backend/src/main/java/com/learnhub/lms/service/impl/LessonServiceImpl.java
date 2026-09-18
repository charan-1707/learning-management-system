package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.LessonCompleteRequest;
import com.learnhub.lms.dto.request.LessonRequest;
import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.dto.response.LessonResponse;
import com.learnhub.lms.entity.Lesson;
import com.learnhub.lms.entity.LessonProgress;
import com.learnhub.lms.entity.Module;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.EnrollmentRepository;
import com.learnhub.lms.repository.LessonProgressRepository;
import com.learnhub.lms.repository.LessonRepository;
import com.learnhub.lms.repository.ModuleRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.EnrollmentService;
import com.learnhub.lms.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsForModule(Long moduleId, Long studentId) {
        return withCompletion(lessonRepository.findByModuleIdOrderByDisplayOrderAsc(moduleId), studentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsForCourse(Long courseId, Long studentId) {
        return withCompletion(lessonRepository.findByModuleCourseId(courseId), studentId);
    }

    @Override
    public LessonResponse createLesson(Long moduleId, LessonRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        applyRequest(lesson, request);
        if (lesson.getDisplayOrder() == null) {
            lesson.setDisplayOrder(lessonRepository.findByModuleId(moduleId).size() + 1);
        }
        return mapper.toLessonResponse(lessonRepository.save(lesson));
    }

    @Override
    public LessonResponse updateLesson(Long lessonId, LessonRequest request) {
        Lesson lesson = findOrThrow(lessonId);
        applyRequest(lesson, request);
        return mapper.toLessonResponse(lessonRepository.save(lesson));
    }

    @Override
    public void deleteLesson(Long lessonId) {
        Lesson lesson = findOrThrow(lessonId);
        lessonProgressRepository.deleteByLessonIdsIn(List.of(lessonId));
        lessonRepository.deleteLessonById(lessonId);
    }

    @Override
    @Transactional
    public List<LessonResponse> reorderLessons(Long moduleId, List<Long> orderedLessonIds) {
        if (orderedLessonIds == null) {
            return getLessonsForModule(moduleId, null);
        }
        int order = 1;
        for (Long lessonId : orderedLessonIds) {
            Lesson lesson = findOrThrow(lessonId);
            lesson.setDisplayOrder(order++);
        }
        return getLessonsForModule(moduleId, null);
    }

    @Override
    public LessonProgressResponse markComplete(Long lessonId, LessonCompleteRequest request) {
        Lesson lesson = findOrThrow(lessonId);
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));
        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessRuleException("Only STUDENT users can mark lessons complete.");
        }
        Long courseId = lesson.getModule().getCourse().getId();
        if (!enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), courseId)) {
            throw new BusinessRuleException("Student is not enrolled in this course.");
        }

        LessonProgress progress = lessonProgressRepository
                .findByStudentIdAndLessonId(request.getStudentId(), lessonId)
                .orElseGet(() -> {
                    LessonProgress p = new LessonProgress();
                    p.setStudent(student);
                    p.setLesson(lesson);
                    return p;
                });

        progress.setCompleted(request.isCompleted());
        if (request.isCompleted()) {
            progress.setCompletedAt(java.time.LocalDateTime.now());
        } else {
            progress.setCompletedAt(null);
        }
        LessonProgress saved = lessonProgressRepository.save(progress);

        enrollmentService.recalculateProgress(request.getStudentId(), courseId);
        return mapper.toLessonProgressResponse(saved);
    }

    private List<LessonResponse> withCompletion(List<Lesson> lessons, Long studentId) {
        Map<Long, LessonProgress> progressByLesson = findProgressByLesson(lessons, studentId);
        return lessons.stream()
                .map(l -> mapper.toLessonResponse(
                        l,
                        progressByLesson.containsKey(l.getId())
                                ? progressByLesson.get(l.getId()).isCompleted()
                                : null))
                .toList();
    }

    private Map<Long, LessonProgress> findProgressByLesson(List<Lesson> lessons, Long studentId) {
        if (studentId == null || lessons.isEmpty()) {
            return Map.of();
        }
        List<Long> lessonIds = lessons.stream().map(Lesson::getId).toList();
        return lessonProgressRepository.findByStudentIdAndLessonModuleCourseId(studentId,
                        lessons.get(0).getModule().getCourse().getId()).stream()
                .filter(p -> lessonIds.contains(p.getLesson().getId()))
                .collect(Collectors.toMap(p -> p.getLesson().getId(), Function.identity()));
    }

    private void applyRequest(Lesson lesson, LessonRequest request) {
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setContentType(request.getContentType());
        lesson.setContentUrl(request.getContentUrl());
        lesson.setDuration(request.getDuration());
        lesson.setDisplayOrder(request.getDisplayOrder());
    }

    private Lesson findOrThrow(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", id));
    }
}