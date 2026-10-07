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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 7 acceptance (plan §12) on H2: attendance upsert/math, announcement
 * fan-out, notification reads, statistics/export, upload/download gates,
 * faculty feeds, student-progress.
 */
@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.uploads-dir=./target/test-uploads"})
@AutoConfigureMockMvc
class Phase7MiscTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;
  @Autowired JwtService jwt;

  private String adminTok;
  private String ownerTok;
  private String studentTok;
  private String outsiderTok;
  private User student;

  @BeforeEach
  void seed() {
    adminTok = token(mk("p7-admin", Role.admin));
    ownerTok = token(mk("p7-owner", Role.faculty));
    student = mk("p7-student", Role.student);
    studentTok = token(student);
    outsiderTok = token(mk("p7-outsider", Role.student));
  }

  private User mk(String kind, Role role) {
    User u = new User();
    u.setName("P7 " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("pw"));
    u.setRole(role);
    u.setStatus(UserStatus.active);
    return users.saveAndFlush(u);
  }

  private String token(User u) {
    return jwt.issueAccessToken(String.valueOf(u.getId()), u.getRole().name(), u.getEmail());
  }

  private String openCourseEnrolled() throws Exception {
    MvcResult r = mvc.perform(post("/api/courses").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"P7 Course " + System.nanoTime() + "\"}"))
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

  @Test
  void attendanceUpsertAndOverall() throws Exception {
    String courseId = openCourseEnrolled();
    String body = "{\"date\":\"2024-03-04\",\"records\":["
        + "{\"studentId\":" + student.getId() + ",\"status\":\"present\"}]}";

    mvc.perform(post("/api/courses/" + courseId + "/attendance/sessions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.records[0].status").value("present"));

    mvc.perform(get("/api/students/me/attendance/overall")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.present").value(1))
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.percent").value(100));

    // same date re-taken: upsert flips, no duplicate session
    String flip = "{\"date\":\"2024-03-04\",\"records\":["
        + "{\"studentId\":" + student.getId() + ",\"status\":\"absent\"}]}";
    mvc.perform(post("/api/courses/" + courseId + "/attendance/sessions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(flip))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/students/me/attendance/overall")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.present").value(0))
        .andExpect(jsonPath("$.percent").value(0));

    mvc.perform(get("/api/students/me/attendance/history")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("absent"));

    mvc.perform(get("/api/courses/" + courseId + "/attendance")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.overall.total").value(1));

    mvc.perform(post("/api/courses/" + courseId + "/attendance/sessions")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isForbidden());
  }

  @Test
  void sessionByDateAndFutureBlocked() throws Exception {
    String courseId = openCourseEnrolled();
    String studentId = String.valueOf(student.getId());
    String day = "2024-05-06";
    String body = "{\"date\":\"" + day + "\",\"records\":["
        + "{\"studentId\":" + studentId + ",\"status\":\"present\"}]}";

    mvc.perform(post("/api/courses/" + courseId + "/attendance/sessions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/courses/" + courseId + "/attendance/sessions?date=" + day)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.date").value(day))
        .andExpect(jsonPath("$.records[0].status").value("present"));

    mvc.perform(get("/api/courses/" + courseId + "/attendance/sessions?date=2030-01-01")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isNotFound());

    mvc.perform(get("/api/courses/" + courseId + "/attendance/sessions?date=" + day)
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isForbidden());

    mvc.perform(post("/api/courses/" + courseId + "/attendance/sessions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"date\":\"2099-01-01\",\"records\":[]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));
  }

  @Test
  void announcementFansOutThenReadFlow() throws Exception {
    String courseId = openCourseEnrolled();

    mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(0));

    mvc.perform(post("/api/courses/" + courseId + "/announcements")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Hello\",\"body\":\"World\"}"))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1));

    // outsider (unenrolled) gets nothing
    MvcResult list = mvc.perform(get("/api/notifications/me")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andReturn();
    String notifId = list.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];

    mvc.perform(patch("/api/notifications/" + notifId + "/read")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk());
    mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(0));

    // someone else's notification is invisible
    mvc.perform(patch("/api/notifications/" + notifId + "/read")
            .header("Authorization", "Bearer " + outsiderTok))
        .andExpect(status().isNotFound());
  }

  @Test
  void statisticsReportsExportSettings() throws Exception {
    mvc.perform(get("/api/admin/statistics").header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalCourses").exists())
        .andExpect(jsonPath("$.publishedCourses").exists())
        .andExpect(jsonPath("$.totalStudents").exists())
        .andExpect(jsonPath("$.totalFaculty").exists())
        .andExpect(jsonPath("$.totalUsers").exists())
        .andExpect(jsonPath("$.enrollments").exists())
        .andExpect(jsonPath("$.submissions").exists())
        .andExpect(jsonPath("$.submissionsToday").exists())
        .andExpect(jsonPath("$.activeUsers").exists());

    mvc.perform(get("/api/admin/reports").header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enrollmentByCourse").isArray())
        .andExpect(jsonPath("$.monthlyActive").isArray())
        .andExpect(jsonPath("$.passRate").exists())
        .andExpect(jsonPath("$.distributionByProgram").isArray());

    mvc.perform(get("/api/admin/export?type=users").header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Disposition",
            org.hamcrest.Matchers.containsString("users-export.csv")))
        .andExpect(content().string(org.hamcrest.Matchers.startsWith("id,name,email,role,status,dept,program")));

    mvc.perform(get("/api/admin/export?type=bogus").header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isBadRequest());

    mvc.perform(patch("/api/admin/settings").header("Authorization", "Bearer " + adminTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"theme\":\"dark\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.theme").value("dark"));
  }

  @Test
  void thumbnailRoundTripAndTokenDownload() throws Exception {
    String courseId = openCourseEnrolled();
    mvc.perform(patch("/api/courses/" + courseId)
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"thumbnailUrl\":\"/api/files/abc\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.thumbnailUrl").value("/api/files/abc"));

    MockMultipartFile pdf = new MockMultipartFile("file", "pic.png", "image/png", "PNGDATA".getBytes());
    MvcResult r = mvc.perform(multipart("/api/uploads").file(pdf)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isCreated())
        .andReturn();
    String fid = r.getResponse().getContentAsString().split("\"fileId\":\"")[1].split("\"")[0];

    mvc.perform(get("/api/files/" + fid + "?token=" + ownerTok)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk());
    mvc.perform(get("/api/files/" + fid + "?token=bogus"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void courseCoverVisibleToUnenrolledStudent() throws Exception {
    String courseId = openCourseEnrolled();
    MockMultipartFile pic = new MockMultipartFile("file", "cover.png", "image/png",
        "PNGDATA".getBytes());
    MvcResult r = mvc.perform(multipart("/api/uploads").file(pic)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isCreated())
        .andReturn();
    String fid = r.getResponse().getContentAsString().split("\"fileId\":\"")[1].split("\"")[0];
    mvc.perform(patch("/api/courses/" + courseId)
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"thumbnailUrl\":\"/api/files/" + fid + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.thumbnailUrl").value("/api/files/" + fid));

    // outsider student (zero enrollments) can load the course cover ...
    mvc.perform(get("/api/files/" + fid + "?token=" + outsiderTok))
        .andExpect(status().isOk());

    // ... but not an ordinary (non-cover) file.
    MockMultipartFile notes = new MockMultipartFile("file", "notes.pdf", "application/pdf",
        "%PDF-1.4 test".getBytes());
    MvcResult r2 = mvc.perform(multipart("/api/uploads").file(notes)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isCreated())
        .andReturn();
    String fid2 = r2.getResponse().getContentAsString().split("\"fileId\":\"")[1].split("\"")[0];
    mvc.perform(get("/api/files/" + fid2 + "?token=" + outsiderTok))
        .andExpect(status().isForbidden());
  }

  @Test
  void avatarVisibleToUnenrolledStudent() throws Exception {
    MockMultipartFile pic = new MockMultipartFile("file", "face.png", "image/png",
        "PNGDATA".getBytes());
    MvcResult r = mvc.perform(multipart("/api/uploads").file(pic)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isCreated())
        .andReturn();
    String fid = r.getResponse().getContentAsString().split("\"fileId\":\"")[1].split("\"")[0];

    User owner = users.findAll().stream()
        .filter(u -> u.getEmail().startsWith("p7-owner."))
        .findFirst().orElseThrow();
    owner.setAvatarUrl("/api/files/" + fid);
    users.saveAndFlush(owner);

    // zero-enrollment outsider can load a referenced profile photo ...
    mvc.perform(get("/api/files/" + fid + "?token=" + outsiderTok))
        .andExpect(status().isOk());
  }

  @Test
  void uploadDownloadGates() throws Exception {
    MockMultipartFile pdf = new MockMultipartFile("file", "notes.pdf", "application/pdf",
        "%PDF-1.4 test".getBytes());
    MvcResult r = mvc.perform(multipart("/api/uploads").file(pdf)
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.fileId").exists())
        .andExpect(jsonPath("$.url").exists())
        .andReturn();
    String url = r.getResponse().getContentAsString().split("\"url\":\"")[1].split("\"")[0];

    mvc.perform(get(url).header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk());
    mvc.perform(get(url).header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isOk());
    mvc.perform(get(url).header("Authorization", "Bearer " + outsiderTok))
        .andExpect(status().isForbidden());

    MockMultipartFile exe = new MockMultipartFile("file", "evil.exe",
        "application/octet-stream", "MZ".getBytes());
    mvc.perform(multipart("/api/uploads").file(exe)
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isBadRequest());
  }

  @Test
  void facultyFeedsAndStudentProgress() throws Exception {
    String courseId = openCourseEnrolled();
    MvcResult ar = mvc.perform(post("/api/courses/" + courseId + "/assignments")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"HW " + System.nanoTime()
                + "\",\"maxMarks\":10,\"due\":\"2030-01-01T10:00:00\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    String aid = ar.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(post("/api/assignments/" + aid + "/submit")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"content\":\"done\"}"))
        .andExpect(status().isCreated());

    MvcResult an = mvc.perform(post("/api/courses/" + courseId + "/announcements")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Read me\",\"body\":\"Body\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    String anId = an.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];

    mvc.perform(get("/api/faculty/me/pending-submissions")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.assignmentId=='" + aid + "')]").isNotEmpty());

    mvc.perform(get("/api/faculty/me/activity").header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$.length()").value(2));

    mvc.perform(get("/api/courses/" + courseId + "/student-progress")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].studentId").value(student.getId()))
        .andExpect(jsonPath("$[0].atRisk").value(true));

    mvc.perform(delete("/api/announcements/" + anId)
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/announcements/" + anId)
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk());
  }
}
