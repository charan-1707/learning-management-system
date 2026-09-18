package com.learnhub.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.request.LoginRequest;
import com.learnhub.lms.dto.request.RegisterRequest;
import com.learnhub.lms.entity.User;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 2 end-to-end tests: course management, role authorization, and
 * student enrollment (H2, full Spring context).
 */
@SpringBootTest
@AutoConfigureMockMvc
class CourseEnrollmentFlowTest {

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
        String body = objectMapper.writeValueAsString(new CourseRequest(title, code, "desc", "CS", null));
        MvcResult result = mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
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
    void instructorCreatesCourse_StudentCannot() throws Exception {
        createUser("p2.prof.a@test.com", UserRole.FACULTY);
        String profToken = login("p2.prof.a@test.com", "secret123");
        String studentToken = register("p2.stu.a@test.com");

        String courseId = createCourse(profToken, "Phase2 Course", "P2-1");

        mockMvc.perform(get("/api/courses/" + courseId).header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Phase2 Course"))
                .andExpect(jsonPath("$.facultyName").value("User p2.prof.a@test.com"));

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Nope", "P2-X", "desc", "CS", null))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateCourse() throws Exception {
        createUser("p2.admin@test.com", UserRole.ADMIN);
        String token = login("p2.admin@test.com", "secret123");

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Admin Course", "P2-ADM", "desc", "CS", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.facultyName").value("User p2.admin@test.com"));
    }

    @Test
    void ownershipEnforcedOnUpdateAndDelete() throws Exception {
        createUser("p2.prof.b@test.com", UserRole.FACULTY);
        createUser("p2.prof.c@test.com", UserRole.FACULTY);
        String profBToken = login("p2.prof.b@test.com", "secret123");
        String profCToken = login("p2.prof.c@test.com", "secret123");
        String studentToken = register("p2.stu.b@test.com");

        String bCourse = createCourse(profBToken, "B's Course", "P2-B");

        // owner updates own course
        mockMvc.perform(put("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + profBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("B's Course v2", "P2-B", "updated", "CS", null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("B's Course v2"));

        // another instructor cannot update
        mockMvc.perform(put("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + profCToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Hijack", "P2-C", "desc", "CS", null))))
                .andExpect(status().isForbidden());

        // student cannot update
        mockMvc.perform(put("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Nope", "P2-X", "desc", "CS", null))))
                .andExpect(status().isForbidden());

        // another instructor cannot delete
        mockMvc.perform(delete("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + profCToken))
                .andExpect(status().isForbidden());

        // student cannot delete
        mockMvc.perform(delete("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        // owner can delete own course
        mockMvc.perform(delete("/api/courses/" + bCourse)
                        .header("Authorization", "Bearer " + profBToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/courses/" + bCourse))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminCanManageAnyCourse() throws Exception {
        createUser("p2.prof.d@test.com", UserRole.FACULTY);
        createUser("p2.admin2@test.com", UserRole.ADMIN);
        String profToken = login("p2.prof.d@test.com", "secret123");
        String adminToken = login("p2.admin2@test.com", "secret123");

        String courseId = createCourse(profToken, "Managed", "P2-D");

        mockMvc.perform(put("/api/courses/" + courseId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CourseRequest("Managed by Admin", "P2-D", "desc", "CS", null))))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/courses/" + courseId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void studentEnrollmentLifecycle() throws Exception {
        createUser("p2.prof.e@test.com", UserRole.FACULTY);
        String profToken = login("p2.prof.e@test.com", "secret123");
        String studentToken = register("p2.stu.e@test.com");

        String courseId = createCourse(profToken, "Enrollable", "P2-E");
        publishCourse(profToken, courseId);

        // enroll
        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseId").value(Integer.parseInt(courseId)));

        // duplicate enrollment -> 409
        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isConflict());

        // enrollment check -> true
        mockMvc.perform(get("/api/courses/" + courseId + "/enrollment")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrolled").value(true));

        // my enrolled courses contains this course
        mockMvc.perform(get("/api/students/me/courses")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Enrollable"));

        // cannot enroll in a nonexistent course
        mockMvc.perform(post("/api/courses/999999/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void onlyStudentsCanEnrollAndUnenroll() throws Exception {
        createUser("p2.prof.f@test.com", UserRole.FACULTY);
        createUser("p2.admin3@test.com", UserRole.ADMIN);
        String profToken = login("p2.prof.f@test.com", "secret123");
        String adminToken = login("p2.admin3@test.com", "secret123");
        String studentToken = register("p2.stu.f@test.com");

        String courseId = createCourse(profToken, "Only Students", "P2-F");
        publishCourse(profToken, courseId);

        // instructor cannot enroll
        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + profToken))
                .andExpect(status().isForbidden());

        // admin cannot enroll
        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // student enrolls then unenrolls
        mockMvc.perform(post("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/courses/" + courseId + "/enroll")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/courses/" + courseId + "/enrollment")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrolled").value(false));

        // my enrolled courses is empty after unenroll
        MvcResult result = mockMvc.perform(get("/api/students/me/courses")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isZero();
    }

    @Test
    void instructorSeesOnlyOwnCourses() throws Exception {
        createUser("p2.prof.g@test.com", UserRole.FACULTY);
        createUser("p2.prof.h@test.com", UserRole.FACULTY);
        String tokenA = login("p2.prof.g@test.com", "secret123");
        String tokenB = login("p2.prof.h@test.com", "secret123");

        createCourse(tokenA, "A Course", "P2-G");
        createCourse(tokenB, "B Course", "P2-H");

        MvcResult result = mockMvc.perform(get("/api/instructors/me/courses")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.size()).isEqualTo(1);
        assertThat(json.path(0).path("title").asText()).isEqualTo("A Course");
    }

    @Test
    void authenticatedUsersCanViewAllCourses() throws Exception {
        createUser("p2.prof.i@test.com", UserRole.FACULTY);
        String profToken = login("p2.prof.i@test.com", "secret123");
        String studentToken = register("p2.stu.i@test.com");

        createCourse(profToken, "Viewable", "P2-I");

        mockMvc.perform(get("/api/courses").header("Authorization", "Bearer " + profToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/courses").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());
    }
}