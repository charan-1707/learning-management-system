package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.entity.Assignment;
import com.learnhub.lms.entity.Attendance;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Enrollment;
import com.learnhub.lms.entity.Lesson;
import com.learnhub.lms.entity.Module;
import com.learnhub.lms.entity.Notification;
import com.learnhub.lms.entity.Quiz;
import com.learnhub.lms.entity.QuizAttempt;
import com.learnhub.lms.entity.Submission;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.DuplicateResourceException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.AnnouncementRepository;
import com.learnhub.lms.repository.AssignmentRepository;
import com.learnhub.lms.repository.AttendanceRepository;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.EnrollmentRepository;
import com.learnhub.lms.repository.LessonProgressRepository;
import com.learnhub.lms.repository.LessonRepository;
import com.learnhub.lms.repository.ModuleRepository;
import com.learnhub.lms.repository.QuizAnswerRepository;
import com.learnhub.lms.repository.QuizAttemptRepository;
import com.learnhub.lms.repository.QuizQuestionRepository;
import com.learnhub.lms.repository.QuizRepository;
import com.learnhub.lms.repository.SubmissionRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final AttendanceRepository attendanceRepository;
    private final AnnouncementRepository announcementRepository;
    private final EntityMapper mapper;

    @Override
    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Course code '" + request.getCode() + "' already exists.");
        }
        User faculty = userRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getFacultyId()));
        if (faculty.getRole() != UserRole.FACULTY && faculty.getRole() != UserRole.ADMIN) {
            throw new BusinessRuleException("Course faculty must have the FACULTY (or ADMIN) role.");
        }
        Course course = new Course();
        applyRequest(course, request);
        course.setFaculty(faculty);
        return mapper.toCourseResponse(courseRepository.save(course));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses() {
        return mapper.toCourseResponses(courseRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getPublishedCourses() {
        return mapper.toCourseResponses(courseRepository.findByStatus(CourseStatus.PUBLISHED));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByFaculty(Long facultyId) {
        return mapper.toCourseResponses(courseRepository.findByFacultyIdOrderByUpdatedAtDesc(facultyId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByStatus(CourseStatus status) {
        return mapper.toCourseResponses(courseRepository.findByStatus(status));
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id) {
        return mapper.toCourseResponse(findOrThrow(id));
    }

    @Override
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = findOrThrow(id);
        if (!request.getCode().equals(course.getCode())
                && courseRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new DuplicateResourceException("Course code '" + request.getCode() + "' already exists.");
        }
        applyRequest(course, request);
        return mapper.toCourseResponse(courseRepository.save(course));
    }

    @Override
    public CourseResponse setCourseStatus(Long id, CourseStatus status) {
        Course course = findOrThrow(id);
        course.setStatus(status);
        return mapper.toCourseResponse(courseRepository.save(course));
    }

    @Override
    public void deleteCourse(Long id) {
        Course course = findOrThrow(id);

        List<Module> modules = moduleRepository.findByCourseId(id);
        if (!modules.isEmpty()) {
            List<Long> moduleIds = modules.stream().map(Module::getId).toList();
            List<Lesson> lessons = lessonRepository.findByModuleIdIn(moduleIds);
            lessonProgressRepository.deleteAll(lessonProgressRepository.findByLessonIdIn(
                    lessons.stream().map(Lesson::getId).toList()));
            lessonRepository.deleteAll(lessons);
            moduleRepository.deleteAll(modules);
        }

        List<Assignment> assignments = assignmentRepository.findByCourseId(id);
        assignments.forEach(a -> submissionRepository.deleteAll(submissionRepository.findByAssignmentId(a.getId())));
        assignmentRepository.deleteAll(assignments);

        List<Quiz> quizzes = quizRepository.findByCourseId(id);
        for (Quiz quiz : quizzes) {
            quizQuestionRepository.deleteAll(quizQuestionRepository.findByQuizId(quiz.getId()));
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quiz.getId());
            attempts.forEach(a -> quizAnswerRepository.deleteAll(quizAnswerRepository.findByAttemptId(a.getId())));
            quizAttemptRepository.deleteAll(attempts);
        }
        quizRepository.deleteAll(quizzes);

        attendanceRepository.deleteAll(attendanceRepository.findByCourseId(id));
        announcementRepository.deleteAll(announcementRepository.findByCourseIdOrderByCreatedAtDesc(id));
        enrollmentRepository.deleteAll(enrollmentRepository.findByCourseId(id));

        courseRepository.delete(course);
    }

    private void applyRequest(Course course, CourseRequest request) {
        course.setTitle(request.getTitle());
        course.setCode(request.getCode());
        course.setDescription(request.getDescription());
        course.setCategory(request.getCategory());
        if (request.getStatus() != null) {
            course.setStatus(request.getStatus());
        }
    }

    private Course findOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));
    }
}