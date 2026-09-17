package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Enrollment;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.EnrollmentStatus;
import com.learnhub.lms.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class EnrollmentRepositoryTest {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        User faculty = new User();
        faculty.setName("Dr. Smith");
        faculty.setEmail("smith2@learnhub.com");
        faculty.setPassword("{bcrypt}hash");
        faculty.setRole(UserRole.FACULTY);
        userRepository.saveAndFlush(faculty);

        student = new User();
        student.setName("Alice");
        student.setEmail("alice@learnhub.com");
        student.setPassword("{bcrypt}hash");
        student.setRole(UserRole.STUDENT);
        userRepository.saveAndFlush(student);

        course = new Course();
        course.setTitle("Data Structures");
        course.setCode("DS202");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setFaculty(faculty);
        courseRepository.saveAndFlush(course);
    }

    @Test
    void existsByStudentIdAndCourseId_detectsExistingEnrollment() {
        enrollmentRepository.saveAndFlush(sampleEnrollment());

        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())).isTrue();
        assertThat(enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), -1L)).isFalse();
    }

    @Test
    void studentCannotEnrollTwice_isEnforcedByUniqueConstraint() {
        enrollmentRepository.saveAndFlush(sampleEnrollment());

        assertThatThrownBy(() -> enrollmentRepository.saveAndFlush(sampleEnrollment()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByStudentIdAndCourseId_returnsSingleEnrollment() {
        enrollmentRepository.saveAndFlush(sampleEnrollment());

        assertThat(enrollmentRepository.findByStudentIdAndCourseId(student.getId(), course.getId()))
                .isPresent();
    }

    @Test
    void findMethods_scopeByStudentAndCourse() {
        enrollmentRepository.saveAndFlush(sampleEnrollment());

        assertThat(enrollmentRepository.findByStudentId(student.getId())).hasSize(1);
        assertThat(enrollmentRepository.findByCourseId(course.getId())).hasSize(1);
        assertThat(enrollmentRepository.findByStudentId(-1L)).isEmpty();
    }

    private Enrollment sampleEnrollment() {
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setProgress(BigDecimal.ZERO);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        return enrollment;
    }
}