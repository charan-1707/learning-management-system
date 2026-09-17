package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Lesson;
import com.learnhub.lms.entity.LessonProgress;
import com.learnhub.lms.entity.Module;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.ContentType;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class LessonProgressRepositoryTest {

    @Autowired
    private LessonProgressRepository lessonProgressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ModuleRepository moduleRepository;

    @Autowired
    private LessonRepository lessonRepository;

    private User student;
    private Lesson lesson;

    @BeforeEach
    void setUp() {
        User faculty = new User();
        faculty.setName("Dr. Smith");
        faculty.setEmail("smith3@learnhub.com");
        faculty.setPassword("{bcrypt}hash");
        faculty.setRole(UserRole.FACULTY);
        userRepository.saveAndFlush(faculty);

        student = new User();
        student.setName("Alice");
        student.setEmail("alice3@learnhub.com");
        student.setPassword("{bcrypt}hash");
        student.setRole(UserRole.STUDENT);
        userRepository.saveAndFlush(student);

        Course course = new Course();
        course.setTitle("Databases");
        course.setCode("DB303");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setFaculty(faculty);
        courseRepository.saveAndFlush(course);

        Module module = new Module();
        module.setTitle("SQL Basics");
        module.setCourse(course);
        moduleRepository.saveAndFlush(module);

        lesson = new Lesson();
        lesson.setTitle("Select statements");
        lesson.setModule(module);
        lesson.setContentType(ContentType.VIDEO);
        lessonRepository.saveAndFlush(lesson);
    }

    @Test
    void progressPerStudentAndLesson_isUnique() {
        lessonProgressRepository.saveAndFlush(sampleProgress());

        assertThatThrownBy(() -> lessonProgressRepository.saveAndFlush(sampleProgress()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByStudentIdAndLessonId_returnsProgress() {
        lessonProgressRepository.saveAndFlush(sampleProgress());

        assertThat(lessonProgressRepository.findByStudentIdAndLessonId(student.getId(), lesson.getId()))
                .isPresent();
        assertThat(lessonProgressRepository.findByStudentId(student.getId())).hasSize(1);
    }

    private LessonProgress sampleProgress() {
        LessonProgress progress = new LessonProgress();
        progress.setStudent(student);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        return progress;
    }
}