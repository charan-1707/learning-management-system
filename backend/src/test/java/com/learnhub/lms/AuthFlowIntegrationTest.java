package com.learnhub.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.request.EnrollmentRequest;
import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.QuizQuestionRequest;
import com.learnhub.lms.dto.request.QuizRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.entity.User;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end authentication smoke test (H2, full Spring context): public
 * register/login, JWT issuance, /auth/me, role access control and the
 * student self-service flow (enroll -> quiz attempt).
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String register(String name, String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new RegisterRequest(name, email, password));
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private String login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginRequest(email, password));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.path("user").path("email").asText()).isEqualTo(email.toLowerCase());
        return json.path("token").asText();
    }

    @Test
    void register_login_me_fullLifecycle() throws Exception {
        String token = register("Alice Student", "alice.smoke@test.com", "secret123");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice.smoke@test.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Alice Again", "alice.smoke@test.com", "secret123"))))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("alice.smoke@test.com", "wrong"))))
                .andExpect(status().isUnauthorized());

        String loginToken = login("ALICE.SMOKE@TEST.COM", "secret123");
        assertThat(loginToken).isNotBlank();
    }

    @Test
    void anonymousCannotMutateContent() throws Exception {
        mockMvc.perform(post("/api/courses").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/quizzes/1/attempts").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/enrollments").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollmentRequest(1L, 1L))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void studentCannotManageContentAndSelfEnrolls() throws Exception {
        User admin = createUser("Admin", "admin.smoke@test.com", UserRole.ADMIN);
        User faculty = createUser("Prof", "prof.smoke@test.com", UserRole.FACULTY);
        String facultyToken = login("prof.smoke@test.com", "secret123"); // user#login saves it
        String studentToken = register("Bob Student", "bob.smoke@test.com", "secret123");

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Course", "C1", "desc", "cat", null, faculty.getId()))))
                .andExpect(status().isForbidden());

        MvcResult course = mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Databases", "DB101", "SQL", "CS", null, faculty.getId()))))
                .andExpect(status().isCreated())
                .andReturn();
        long courseId = objectMapper.readTree(course.getResponse().getContentAsString()).path("id").asLong();

        mockMvc.perform(patch("/api/courses/" + courseId + "/status")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());

        User bob = userRepository.findByEmail("bob.smoke@test.com").orElseThrow();
        mockMvc.perform(post("/api/enrollments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollmentRequest(admin.getId(), courseId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.studentId").value(bob.getId().intValue()));

        assertThat(facultyToken).isNotBlank();
    }

    @Test
    void studentAttemptsQuizWithOwnership() throws Exception {
        createUser("Prof2", "prof2.smoke@test.com", UserRole.FACULTY);
        String facultyToken = login("prof2.smoke@test.com", "secret123");
        String studentToken = register("Carol Student", "carol.smoke@test.com", "secret123");

        User faculty = userRepository.findByEmail("prof2.smoke@test.com").orElseThrow();
        MvcResult course = mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Maths", "MATH101", "basic", "Math", null, faculty.getId()))))
                .andExpect(status().isCreated()).andReturn();
        long courseId = objectMapper.readTree(course.getResponse().getContentAsString()).path("id").asLong();

        mockMvc.perform(patch("/api/courses/" + courseId + "/status")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLISHED\"}"))
                .andExpect(status().isOk());

        QuizRequest quiz = new QuizRequest();
        quiz.setTitle("Quiz 1");
        quiz.setDurationMinutes(10);
        quiz.setMaxAttempts(2);
        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setQuestions(List.of(
                new QuizQuestionRequest("2+2?", "4", "5", "6", "7", "A", BigDecimal.valueOf(5), null)));

        MvcResult quizResult = mockMvc.perform(post("/api/courses/" + courseId + "/quizzes")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(quiz)))
                .andExpect(status().isCreated()).andReturn();
        long quizId = objectMapper.readTree(quizResult.getResponse().getContentAsString()).path("id").asLong();

        User carol = userRepository.findByEmail("carol.smoke@test.com").orElseThrow();
        mockMvc.perform(post("/api/enrollments")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EnrollmentRequest(999L, courseId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.studentId").value(carol.getId().intValue()));

        MvcResult attempt = mockMvc.perform(post("/api/quizzes/" + quizId + "/attempts")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":999}"))
                .andExpect(status().isCreated()).andReturn();
        long attemptId = objectMapper.readTree(attempt.getResponse().getContentAsString()).path("id").asLong();

        // another student cannot submit Carol's attempt
        String daveToken = register("Dave Student", "dave.smoke@test.com", "secret123");
        mockMvc.perform(post("/api/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + daveToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\":[]}"))
                .andExpect(status().isBadRequest());

        // fetch real question id via the public attempt-catalog endpoint
        MvcResult questions = mockMvc.perform(get("/api/quizzes/" + quizId + "/questions/attempt"))
                .andExpect(status().isOk()).andReturn();
        JsonNode q = objectMapper.readTree(questions.getResponse().getContentAsString()).path(0);
        long questionId = q.path("id").asLong();

        mockMvc.perform(post("/api/attempts/" + attemptId + "/submit")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\":[{\"questionId\":" + questionId
                                + ",\"selectedOption\":\"A\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(5.00))
                .andExpect(jsonPath("$.correctAnswers").value(1));
    }

    private User createUser(String name, String email, UserRole role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }
}