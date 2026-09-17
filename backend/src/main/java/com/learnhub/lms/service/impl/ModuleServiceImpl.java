package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.ModuleRequest;
import com.learnhub.lms.dto.response.ModuleResponse;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Lesson;
import com.learnhub.lms.entity.Module;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.LessonProgressRepository;
import com.learnhub.lms.repository.LessonRepository;
import com.learnhub.lms.repository.ModuleRepository;
import com.learnhub.lms.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ModuleServiceImpl implements ModuleService {

    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<ModuleResponse> getModulesForCourse(Long courseId) {
        return mapper.toModuleResponses(moduleRepository.findByCourseIdOrderByDisplayOrderAsc(courseId));
    }

    @Override
    public ModuleResponse createModule(Long courseId, ModuleRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        Module module = new Module();
        module.setCourse(course);
        applyRequest(module, request);
        if (module.getDisplayOrder() == null) {
            module.setDisplayOrder(moduleRepository.findByCourseId(courseId).size() + 1);
        }
        return mapper.toModuleResponse(moduleRepository.save(module));
    }

    @Override
    public ModuleResponse updateModule(Long moduleId, ModuleRequest request) {
        Module module = findOrThrow(moduleId);
        applyRequest(module, request);
        return mapper.toModuleResponse(moduleRepository.save(module));
    }

    @Override
    public void deleteModule(Long moduleId) {
        Module module = findOrThrow(moduleId);
        List<Lesson> lessons = lessonRepository.findByModuleId(moduleId);
        lessonProgressRepository.deleteAll(
                lessonProgressRepository.findByLessonIdIn(lessons.stream().map(Lesson::getId).toList()));
        lessonRepository.deleteAll(lessons);
        moduleRepository.delete(module);
    }

    @Override
    @Transactional
    public List<ModuleResponse> reorderModules(Long courseId, List<Long> orderedModuleIds) {
        if (orderedModuleIds == null) {
            return getModulesForCourse(courseId);
        }
        int order = 1;
        for (Long moduleId : orderedModuleIds) {
            Module module = findOrThrow(moduleId);
            module.setDisplayOrder(order++);
        }
        return getModulesForCourse(courseId);
    }

    private void applyRequest(Module module, ModuleRequest request) {
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setDisplayOrder(request.getDisplayOrder());
    }

    private Module findOrThrow(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", id));
    }
}