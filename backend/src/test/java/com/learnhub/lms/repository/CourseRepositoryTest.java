package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class CourseRepositoryTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User faculty;

    @BeforeEach
    void setUp() {
        faculty = new User();
        faculty.setName("Dr. Smith");
        faculty.setEmail("smith@learnhub.com");
        faculty.setPassword("{bcrypt}hash");
        faculty.setRole(UserRole.FACULTY);
        userRepository.saveAndFlush(faculty);
    }

    @Test
    void existsByCode_reflectsExistingCode() {
        courseRepository.saveAndFlush(sampleCourse("CS101", "Intro to CS", CourseStatus.DRAFT));

        assertThat(courseRepository.existsByCode("CS101")).isTrue();
        assertThat(courseRepository.existsByCode("MATH")).isFalse();
        assertThat(courseRepository.existsByCodeAndIdNot("CS101", -1L)).isTrue();
    }

    @Test
    void uniqueCode_isEnforced() {
        courseRepository.saveAndFlush(sampleCourse("CS101", "Intro to CS", CourseStatus.DRAFT));

        assertThatThrownBy(() ->
                courseRepository.saveAndFlush(sampleCourse("CS101", "Duplicated CS", CourseStatus.DRAFT)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByStatus_returnsOnlyMatching() {
        courseRepository.save(sampleCourse("C1", "Draft course", CourseStatus.DRAFT));
        courseRepository.save(sampleCourse("C2", "Published course", CourseStatus.PUBLISHED));

        List<Course> published = courseRepository.findByStatus(CourseStatus.PUBLISHED);

        assertThat(published).hasSize(1);
        assertThat(published.get(0).getCode()).isEqualTo("C2");
    }

    @Test
    void findByFacultyId_returnsFacultyCourses() {
        courseRepository.save(sampleCourse("C1", "First course", CourseStatus.DRAFT));
        courseRepository.save(sampleCourse("C2", "Second course", CourseStatus.DRAFT));

        List<Course> courses = courseRepository.findByFacultyIdOrderByUpdatedAtDesc(faculty.getId());

        assertThat(courses).hasSize(2);
        assertThat(courses).allSatisfy(c -> assertThat(c.getFaculty().getId()).isEqualTo(faculty.getId()));
    }

    private Course sampleCourse(String code, String title, CourseStatus status) {
        Course course = new Course();
        course.setCode(code);
        course.setTitle(title);
        course.setCategory("Engineering");
        course.setStatus(status);
        course.setFaculty(faculty);
        return course;
    }
}