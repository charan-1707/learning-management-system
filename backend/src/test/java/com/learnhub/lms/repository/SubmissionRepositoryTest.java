package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Assignment;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Submission;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.AssignmentStatus;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class SubmissionRepositoryTest {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    private User student;
    private Assignment assignment;

    @BeforeEach
    void setUp() {
        User faculty = new User();
        faculty.setName("Dr. Smith");
        faculty.setEmail("smith4@learnhub.com");
        faculty.setPassword("{bcrypt}hash");
        faculty.setRole(UserRole.FACULTY);
        userRepository.saveAndFlush(faculty);

        student = new User();
        student.setName("Alice");
        student.setEmail("alice4@learnhub.com");
        student.setPassword("{bcrypt}hash");
        student.setRole(UserRole.STUDENT);
        userRepository.saveAndFlush(student);

        Course course = new Course();
        course.setTitle("Networks");
        course.setCode("NW404");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setFaculty(faculty);
        courseRepository.saveAndFlush(course);

        assignment = new Assignment();
        assignment.setTitle("Design a subnet");
        assignment.setCourse(course);
        assignment.setDueDate(LocalDateTime.now().plusDays(7));
        assignment.setMaxMarks(new BigDecimal("20.00"));
        assignment.setStatus(AssignmentStatus.PUBLISHED);
        assignmentRepository.saveAndFlush(assignment);
    }

    @Test
    void oneLogicalSubmissionPerStudentAndAssignment_isEnforced() {
        submissionRepository.saveAndFlush(sampleSubmission("a.pdf"));

        assertThatThrownBy(() -> submissionRepository.saveAndFlush(sampleSubmission("b.pdf")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findMethods_scopeByAssignmentAndStudent() {
        submissionRepository.saveAndFlush(sampleSubmission("a.pdf"));

        assertThat(submissionRepository.findByAssignmentId(assignment.getId())).hasSize(1);
        assertThat(submissionRepository.findByStudentId(student.getId())).hasSize(1);
        assertThat(submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), student.getId()))
                .isPresent();
    }

    private Submission sampleSubmission(String fileName) {
        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setFileName(fileName);
        submission.setFileUrl("uploads/" + fileName);
        return submission;
    }
}