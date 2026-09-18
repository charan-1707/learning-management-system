package com.learnhub.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.dto.request.AssignmentRequest;
import com.learnhub.lms.dto.request.AttendanceRequest;
import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.request.GradeRequest;
import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.ProfileUpdateRequest;
import com.learnhub.lms.dto.request.QuizQuestionRequest;
import com.learnhub.lms.dto.request.QuizRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.dto.request.SubmissionRequest;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.AttendanceStatus;
import com.learnhub.lms.enums.QuizStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import com.learnhub.lms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 3 end-to-end tests: self-service profile update, admin dashboard
 * statistics, student gradebook aggregation and attendance summary (H2, full
 * Spring context).
 */
@SpringBootTest
@AutoConfigureMockMvc
class DashboardAndProfileFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String register(String email) throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("Student " + email, email, "secret123"));
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private String login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(email, password));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private User createUser(String email, UserRole role) {
        User user = new User();
        user.setName("User " + email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    private String createCourse(String token, String title, String code) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest(title, code, "desc", "CS", null))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("id").asText();
    }

    private void publishCourse(String token, String courseId) throws Exception {
        mockMvc.perform(patch("/api/courses/" + courseId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void studentUpdatesOwnProfileAndPassword() throws Exception {
        String token = register("p3.profile@test.com");

        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ProfileUpdateRequest("Renamed Student", "p3.renamed@test.com", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Student"))
                .andExpect(jsonPath("$.email").value("p3.renamed@test.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));

        // token was issued before the email change, so re-login with new credentials
        String tokenAfterRename = login("p3.renamed@test.com", "secret123");

        // duplicate email is rejected
        createUser("p3.taken@test.com", UserRole.FACULTY);
        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + tokenAfterRename)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ProfileUpdateRequest(null, "p3.taken@test.com", null))))
                .andExpect(status().isConflict());

        // old password no longer works, new one does
        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + tokenAfterRename)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ProfileUpdateRequest(null, null, "newsecret123"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("p3.renamed@test.com", "secret123"))))
                .andExpect(status().isUnauthorized());

        String newToken = login("p3.renamed@test.com", "newsecret123");
        assertThat(newToken).isNotBlank();

        // profile update without auth is rejected
        mockMvc.perform(put("/api/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new ProfileUpdateRequest("X", null, null))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminStatsAggregatePlatormCounts() throws Exception {
        createUser("p3.admin@test.com", UserRole.ADMIN);
        String adminToken = login("p3.admin@test.com", "secret123");
        String studentToken = register("p3.stats@test.com");

        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        MvcResult result = mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("totalUsers").asLong()).isGreaterThanOrEqualTo(2);
        assertThat(json.path("totalStudents").asLong()).isGreaterThanOrEqualTo(1);
        assertThat(json.path("totalFaculty").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(json.path("totalCourses").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(json.path("publishedCourses").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(json.path("enrollments").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(json.path("submissions").asLong()).isGreaterThanOrEqualTo(0);
        assertThat(json.path("activeUsers").asLong()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void emptyGradebookAndAttendanceForFreshStudent() throws Exception {
        String token = register("p3.fresh@test.com");

        MvcResult grades = mockMvc.perform(get("/api/students/me/grades")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode gradesJson = objectMapper.readTree(grades.getResponse().getContentAsString());
        assertThat(gradesJson.isArray()).isTrue();
        assertThat(gradesJson.size()).isZero();

        MvcResult attendance = mockMvc.perform(get("/api/students/me/attendance")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode attendanceJson = objectMapper.readTree(attendance.getResponse().getContentAsString());
        assertThat(attendanceJson.path("total").asLong()).isZero();
        assertThat(attendanceJson.path("present").asLong()).isZero();
        assertThat(attendanceJson.path("percent").asInt()).isZero();
        assertThat(attendanceJson.path("courses").asInt()).isZero();
    }

    @Test
    void gradebookAggregatesGradedSubmissionsAndQuizAttempts() throws Exception {
        createUser("p3.faculty@test.com", UserRole.FACULTY);
        String facultyToken = login("p3.faculty@test.com", "secret123");
        String studentToken = register("p3.grades@test.com");

        String courseId = createCourse(facultyToken, "Graded Course", "P3-GB");
        publishCourse(facultyToken, courseId);

        // assignment: created, submitted, graded
        MvcResult assignmentResult = mockMvc.perform(post("/api/courses/" + courseId + "/assignments")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignmentRequest(
                                "Essay", "Write an essay", LocalDateTime.now().plusDays(7),
                                BigDecimal.TEN, null))))
                .andExpect(status().isCreated())
                .andReturn();
        long assignmentId = objectMapper.readTree(assignmentResult.getResponse().getContentAsString())
                .path("id").asLong();

        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated());

        MvcResult submissionResult = mockMvc.perform(post("/api/submissions")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SubmissionRequest(assignmentId, 999L, "essay.pdf",
                                        "https://files/essay.pdf"))))
                .andExpect(status().isCreated())
                .andReturn();
        long submissionId = objectMapper.readTree(submissionResult.getResponse().getContentAsString())
                .path("id").asLong();

        mockMvc.perform(patch("/api/submissions/" + submissionId + "/grade")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new GradeRequest(BigDecimal.valueOf(8), "Good work"))))
                .andExpect(status().isOk());

        // quiz: attempt and submit
        QuizRequest quiz = new QuizRequest();
        quiz.setTitle("Quiz 1");
        quiz.setDurationMinutes(10);
        quiz.setMaxAttempts(2);
        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setQuestions(List.of(new QuizQuestionRequest("2+2?", "4", "5", "6", "7", "A",
                BigDecimal.valueOf(5), null)));

        MvcResult quizResult = mockMvc.perform(post("/api/courses/" + courseId + "/quizzes")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quiz)))
                .andExpect(status().isCreated())
                .andReturn();
        long quizId = objectMapper.readTree(quizResult.getResponse().getContentAsString()).path("id").asLong();

        MvcResult attemptResult = mockMvc.perform(post("/api/quizzes/" + quizId + "/attempts")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":999}"))
                .andExpect(status().isCreated())
                .andReturn();
        long attemptId = objectMapper.readTree(attemptResult.getResponse().getContentAsString())
                .path("id").asLong();

        MvcResult questions = mockMvc.perform(get("/api/quizzes/" + quizId + "/questions/attempt"))
                .andExpect(status().isOk())
                .andReturn();
        long questionId = objectMapper.readTree(questions.getResponse().getContentAsString())
                .path(0).path("id").asLong();

        mockMvc.perform(post("/api/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\":[{\"questionId\":" + questionId
                                + ",\"selectedOption\":\"A\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(5.00));

        MvcResult grades = mockMvc.perform(get("/api/students/me/grades")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode gradesJson = objectMapper.readTree(grades.getResponse().getContentAsString());
        assertThat(gradesJson.size()).isEqualTo(2);

        JsonNode assignmentGrade = findEntry(gradesJson, "assignment");
        assertThat(assignmentGrade.path("assessment").asText()).isEqualTo("Essay");
        assertThat(assignmentGrade.path("course").asText()).isEqualTo("Graded Course");
        assertThat(assignmentGrade.path("score").decimalValue()).isEqualByComparingTo("8");
        assertThat(assignmentGrade.path("max").decimalValue()).isEqualByComparingTo("10");

        JsonNode quizGrade = findEntry(gradesJson, "quiz");
        assertThat(quizGrade.path("assessment").asText()).isEqualTo("Quiz 1");
        assertThat(quizGrade.path("score").decimalValue()).isEqualByComparingTo("5");
        assertThat(quizGrade.path("max").decimalValue()).isEqualByComparingTo("5");
    }

    @Test
    void attendanceSummaryAggregatesPresentAndAbsent() throws Exception {
        createUser("p3.faculty2@test.com", UserRole.FACULTY);
        String facultyToken = login("p3.faculty2@test.com", "secret123");
        String studentToken = register("p3.attendance@test.com");

        String courseId = createCourse(facultyToken, "Attendance Course", "P3-ATT");
        publishCourse(facultyToken, courseId);

        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated());

        User student = userRepository.findByEmail("p3.attendance@test.com").orElseThrow();
        User faculty = userRepository.findByEmail("p3.faculty2@test.com").orElseThrow();

        mark(facultyToken, courseId, student.getId(), faculty.getId(),
                LocalDate.now().minusDays(2), AttendanceStatus.PRESENT);
        mark(facultyToken, courseId, student.getId(), faculty.getId(),
                LocalDate.now().minusDays(1), AttendanceStatus.PRESENT);
        mark(facultyToken, courseId, student.getId(), faculty.getId(),
                LocalDate.now(), AttendanceStatus.ABSENT);

        MvcResult summary = mockMvc.perform(get("/api/students/me/attendance")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(summary.getResponse().getContentAsString());
        assertThat(json.path("total").asLong()).isEqualTo(3);
        assertThat(json.path("present").asLong()).isEqualTo(2);
        assertThat(json.path("percent").asInt()).isEqualTo(67);
        assertThat(json.path("courses").asInt()).isEqualTo(1);
        assertThat(json.path("byCourse").path(0).path("present").asLong()).isEqualTo(2);
        assertThat(json.path("byCourse").path(0).path("total").asLong()).isEqualTo(3);
        assertThat(json.path("history").size()).isEqualTo(3);
        assertThat(json.path("history").path(0).path("status").asText()).isEqualTo("ABSENT");

        // students cannot read another student's rows
        mockMvc.perform(get("/api/students/me/courses")
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isForbidden());
    }

    private void mark(String token, String courseId, Long studentId, Long markedBy,
                      LocalDate date, AttendanceStatus status) throws Exception {
        mockMvc.perform(post("/api/attendance")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AttendanceRequest(
                                Long.parseLong(courseId), studentId, date, status, markedBy))))
                .andExpect(status().isCreated());
    }

    private JsonNode findEntry(JsonNode array, String type) {
        for (JsonNode node : array) {
            if (type.equals(node.path("type").asText())) {
                return node;
            }
        }
        throw new AssertionError("Missing grade entry of type " + type);
    }
}