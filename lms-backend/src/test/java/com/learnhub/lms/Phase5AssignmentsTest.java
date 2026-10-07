package com.learnhub.lms;

import com.learnhub.lms.security.JwtService;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 5 acceptance (plan §10) on H2: submit guards, upsert resubmit,
 * pair-validated grading with grade-row write, gradebook, summary math.
 */
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureMockMvc
class Phase5AssignmentsTest {

  private static final String FUTURE = "2030-06-01T23:59:00";
  private static final String PAST = "2020-06-01T23:59:00";

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;
  @Autowired JwtService jwt;

  private String ownerTok;
  private String otherTok;
  private String studentTok;
  private String adminTok;

  @BeforeEach
  void seed() {
    ownerTok = token(mk("p5-owner", Role.faculty));
    otherTok = token(mk("p5-other", Role.faculty));
    studentTok = token(mk("p5-student", Role.student));
    adminTok = token(mk("p5-admin", Role.admin));
  }

  private User mk(String kind, Role role) {
    User u = new User();
    u.setName("P5 " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("pw"));
    u.setRole(role);
    u.setStatus(UserStatus.active);
    return users.saveAndFlush(u);
  }

  private String token(User u) {
    return jwt.issueAccessToken(String.valueOf(u.getId()), u.getRole().name(), u.getEmail());
  }

  private String openCourse() throws Exception {
    MvcResult r = mvc.perform(post("/api/courses").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"P5 Course " + System.nanoTime() + "\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    String id = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(patch("/api/courses/" + id + "/status")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"published\"}"))
        .andExpect(status().isOk());
    mvc.perform(post("/api/courses/" + id + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated());
    return id;
  }

  private String assignment(String courseId, String due) throws Exception {
    MvcResult r = mvc.perform(post("/api/courses/" + courseId + "/assignments")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Essay " + System.nanoTime()
                + "\",\"maxMarks\":10,\"due\":\"" + due + "\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.maxMarks").value(10))
        .andReturn();
    return r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
  }

  private String submit(String tok, String assignmentId, String content) throws Exception {
    MvcResult r = mvc.perform(post("/api/assignments/" + assignmentId + "/submit")
            .header("Authorization", "Bearer " + tok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"content\":\"" + content + "\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    return r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
  }

  @Test
  void unenrolledSubmitRejected() throws Exception {
    String courseId = openCourse();
    // fresh student, never enrolled
    String freshTok = token(mk("p5-fresh", Role.student));
    String aid = assignment(courseId, FUTURE);
    mvc.perform(post("/api/assignments/" + aid + "/submit")
            .header("Authorization", "Bearer " + freshTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"content\":\"work\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("You must be enrolled in this course to submit."));
  }

  @Test
  void lateSubmitRejected() throws Exception {
    String courseId = openCourse();
    String aid = assignment(courseId, PAST);
    mvc.perform(post("/api/assignments/" + aid + "/submit")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"content\":\"late work\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("This assignment is past its due date."));
  }

  @Test
  void submitGradeGradebookSummaryChain() throws Exception {
    String courseId = openCourse();
    String aid = assignment(courseId, FUTURE);
    String sid = submit(studentTok, aid, "my essay");

    mvc.perform(get("/api/assignments/" + aid + "/submissions")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(sid))
        .andExpect(jsonPath("$[0].status").value("pending"));

    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + aid + "\",\"score\":8,\"feedback\":\"Good\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.submission.status").value("graded"))
        .andExpect(jsonPath("$.submission.score").value(8));

    mvc.perform(get("/api/students/me/grades")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.score==8)]").isNotEmpty());

    mvc.perform(get("/api/students/me/grades/summary")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1))
        .andExpect(jsonPath("$.average").value(80.0))
        .andExpect(jsonPath("$.best.pct").value(80.0))
        .andExpect(jsonPath("$.recent.length()").value(1));

    mvc.perform(get("/api/courses/" + courseId + "/gradebook")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.assignments[?(@.id=='" + aid + "')]").isNotEmpty());

    mvc.perform(get("/api/courses/" + courseId + "/submissions?ungraded=1")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.id=='" + sid + "')]").isEmpty());
  }

  @Test
  void resubmitResetsGrade() throws Exception {
    String courseId = openCourse();
    String aid = assignment(courseId, FUTURE);
    String sid = submit(studentTok, aid, "v1");
    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + aid + "\",\"score\":5}"))
        .andExpect(status().isOk());

    submit(studentTok, aid, "v2");

    mvc.perform(get("/api/students/me/submissions?assignmentId=" + aid)
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("pending"))
        .andExpect(jsonPath("$[0].score").isEmpty());

    mvc.perform(get("/api/students/me/grades")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void wrongPairAndOverscoreRejected() throws Exception {
    String courseId = openCourse();
    String aid = assignment(courseId, FUTURE);
    String other = assignment(courseId, FUTURE);
    String sid = submit(studentTok, aid, "work");

    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + other + "\",\"score\":5}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Submission does not belong to this assignment."));

    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + aid + "\",\"score\":99}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void assignmentAndGradeNotify() throws Exception {
    String courseId = openCourse();
    long before = unread(studentTok);

    String aid = assignment(courseId, FUTURE);
    org.junit.jupiter.api.Assertions.assertEquals(before + 1, unread(studentTok));

    String freshTok = token(mk("p5-nonotif", Role.student));
    org.junit.jupiter.api.Assertions.assertEquals(0, unread(freshTok));

    String sid = submit(studentTok, aid, "work");
    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + aid + "\",\"score\":9}"))
        .andExpect(status().isOk());
    org.junit.jupiter.api.Assertions.assertEquals(before + 2, unread(studentTok));
    org.junit.jupiter.api.Assertions.assertEquals(0, unread(freshTok));

    mvc.perform(get("/api/notifications/me").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='grade')]").isNotEmpty());
  }

  private long unread(String tok) throws Exception {
    MvcResult r = mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + tok))
        .andExpect(status().isOk())
        .andReturn();
    return Long.parseLong(r.getResponse().getContentAsString().split("\"count\":")[1].split("}")[0]);
  }

  @Test
  void attachmentsRoundTrip() throws Exception {
    String courseId = openCourse();
    MvcResult r = mvc.perform(post("/api/courses/" + courseId + "/assignments")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"With files " + System.nanoTime()
                + "\",\"maxMarks\":10,\"due\":\"2030-01-01T10:00:00\","
                + "\"attachments\":[{\"name\":\"Sheet.pdf\",\"size\":12345,\"mime\":\"application/pdf\",\"url\":\"/api/files/xyz\"}]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.attachments[0].name").value("Sheet.pdf"))
        .andReturn();
    String aid = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(get("/api/assignments/" + aid).header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.attachments[0].url").value("/api/files/xyz"));
    mvc.perform(delete("/api/assignments/" + aid).header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk());
  }

  @Test
  void guardsAndDelete() throws Exception {
    String courseId = openCourse();
    String aid = assignment(courseId, FUTURE);
    String sid = submit(studentTok, aid, "work");

    // non-owner faculty cannot grade or read inbox
    mvc.perform(post("/api/submissions/" + sid + "/grade")
            .header("Authorization", "Bearer " + otherTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"assignmentId\":\"" + aid + "\",\"score\":5}"))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/assignments/" + aid + "/submissions")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isForbidden());

    // delete cascades submissions
    mvc.perform(delete("/api/assignments/" + aid)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk());
    mvc.perform(get("/api/assignments/" + aid).header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isNotFound());
  }
}
