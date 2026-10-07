package com.learnhub.lms;

import com.learnhub.lms.admin.ActivityEventRepository;
import com.learnhub.lms.auth.OtpService;
import com.learnhub.lms.auth.PasswordResetService;
import com.learnhub.lms.auth.PasswordResetToken;
import com.learnhub.lms.auth.PasswordResetTokenRepository;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.enrollment.EnrollmentStatus;
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

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static
org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static
org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 2 acceptance (plan §7) on H2: login gates, suspended handling,
 * self profile, admin search/mutations + audit, faculty-scoped reads,
 * live directories. Seed rows are NOT used here — every test builds its own.
 */
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureMockMvc
class Phase2AuthTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired CourseRepository courses;
  @Autowired EnrollmentRepository enrollments;
  @Autowired ActivityEventRepository events;
  @Autowired PasswordEncoder passwords;
  @Autowired JwtService jwt;
  @Autowired PasswordResetTokenRepository resetTokens;
  @Autowired OtpService otp;

  private User admin;
  private User faculty;
  private User student;
  private User stranger;
  private User suspended;

  private User mkUser(String kind, Role role, UserStatus status) {
    User u = new User();
    u.setName("T " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("secret-" + kind));
    u.setRole(role);
    u.setStatus(status);
    u.setEmailVerified(true); /* seeded accounts predate OTP verification */
    return users.saveAndFlush(u);
  }

  @BeforeEach
  void seed() {
    admin = mkUser("admin", Role.admin, UserStatus.active);
    faculty = mkUser("faculty", Role.faculty, UserStatus.active);
    student = mkUser("student", Role.student, UserStatus.active);
    stranger = mkUser("stranger", Role.student, UserStatus.active);
    suspended = mkUser("suspended", Role.student, UserStatus.suspended);

    // Fresh course per run: a shared id would belong to a previous run's faculty.
    String cid = "t-p2-" + System.nanoTime();
    Course c = new Course();
    c.setId(cid);
    c.setName("P2 Course");
    c.setInstructor(faculty);
    c.setInstructorName(faculty.getName());
    courses.saveAndFlush(c);
    Enrollment e = new Enrollment();
    e.setStudent(student);
    e.setCourse(c);
    e.setStatus(EnrollmentStatus.active);
    e.setEnrolledAt(LocalDateTime.now());
    enrollments.saveAndFlush(e);
  }

  private String token(User u) {
    return jwt.issueAccessToken(String.valueOf(u.getId()), u.getRole().name(), u.getEmail());
  }

  private String loginToken(String email, String password) throws Exception {    MvcResult r = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true))
        .andReturn();
    String body = r.getResponse().getContentAsString();
    int at = body.indexOf("\"token\":\"") + 9;
    return body.substring(at, body.indexOf('"', at));
  }

  @Test
  void loginSuccessWrongPasswordAndUnknown() throws Exception {
    loginToken(student.getEmail(), "secret-student");

    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + student.getEmail() + "\",\"password\":\"nope\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(false));

    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"ghost@learnhub.test\",\"password\":\"x\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(false));
  }

  @Test
  void suspendedLoginBlocked() throws Exception {    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + suspended.getEmail() + "\",\"password\":\"secret-suspended\"}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.ok").value(false))
        .andExpect(jsonPath("$.suspended").value(true));
  }

  @Test
  void publicRegisterRequiresOtpThenLogsIn() throws Exception {
    String email = "fresh." + System.nanoTime() + "@learnhub.test";
    mvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Fresh Student\",\"email\":\"" + email + "\",\"password\":\"fresh-pass\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.email").value(email))
        .andExpect(jsonPath("$.token").doesNotExist());

    // correct password but unverified: soft ok:false, no session
    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"fresh-pass\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(false))
        .andExpect(jsonPath("$.unverified").value(true));

    // wrong code rejected
    mvc.perform(post("/api/auth/verify-otp")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"code\":\"000000\"}"))
        .andExpect(status().isBadRequest());

    // real code from the seam tests share with production code
    User pending = users.findByEmail(email).orElseThrow();
    String code = otp.issueCode(pending);
    mvc.perform(post("/api/auth/verify-otp")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.user.role").value("student"));

    // replay rejected, login now works
    mvc.perform(post("/api/auth/verify-otp")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
        .andExpect(status().isBadRequest());
    loginToken(email, "fresh-pass");

    // duplicate email is rejected
    mvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Clone\",\"email\":\"" + email + "\",\"password\":\"other-pass\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.ok").value(false));

    // bad input is rejected
    mvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"\",\"email\":\"bad\",\"password\":\"x\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void forgotPasswordNeverLeaksAndResetFlow() throws Exception {
    // unknown email still answers ok (no enumeration)
    mvc.perform(post("/api/auth/forgot-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"nobody." + System.nanoTime() + "@learnhub.test\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));

    mvc.perform(post("/api/auth/forgot-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + student.getEmail() + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));

    mvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\":\"junk\",\"newPassword\":\"brand-new\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));

    // token row seeded directly (raw token only travels by email)
    String raw = "t-" + System.nanoTime();
    PasswordResetToken row = new PasswordResetToken();
    row.setUser(student);
    row.setTokenHash(PasswordResetService.sha256(raw));
    row.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    resetTokens.saveAndFlush(row);

    mvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\":\"" + raw + "\",\"newPassword\":\"brand-new\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));

    loginToken(student.getEmail(), "brand-new");

    // single-use: replay fails
    mvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"token\":\"" + raw + "\",\"newPassword\":\"another-one\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void adminCreatesUserStudentForbidden() throws Exception {
    String email = "newfac." + System.nanoTime() + "@learnhub.test";
    mvc.perform(post("/api/users").header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"New Faculty\",\"email\":\"" + email
                + "\",\"password\":\"temp-pass\",\"role\":\"faculty\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.role").value("faculty"));

    loginToken(email, "temp-pass");

    mvc.perform(post("/api/users").header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Dup\",\"email\":\"" + email + "\",\"password\":\"temp-pass\",\"role\":\"student\"}"))
        .andExpect(status().isConflict());

    mvc.perform(post("/api/users").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Nope\",\"email\":\"nope." + System.nanoTime()
                + "@learnhub.test\",\"password\":\"temp-pass\",\"role\":\"student\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void registrationAndLoginHonorToggles() throws Exception {
    String at = token(admin);
    String regBody = "{\"name\":\"Toggle Student\",\"email\":\"toggle." + System.nanoTime()
        + "@learnhub.test\",\"password\":\"toggle-pass\"}";
    try {
      mvc.perform(patch("/api/admin/settings").header("Authorization", "Bearer " + at)
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"selfRegistration\":false}"))
          .andExpect(status().isOk());

      mvc.perform(post("/api/auth/register")
              .contentType(MediaType.APPLICATION_JSON)
              .content(regBody))
          .andExpect(status().isForbidden())
          .andExpect(jsonPath("$.ok").value(false));

      mvc.perform(patch("/api/admin/settings").header("Authorization", "Bearer " + at)
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"maintenanceMode\":true}"))
          .andExpect(status().isOk());

      mvc.perform(post("/api/auth/register")
              .contentType(MediaType.APPLICATION_JSON)
              .content(regBody))
          .andExpect(status().isServiceUnavailable());

      mvc.perform(post("/api/auth/login")
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"email\":\"" + student.getEmail() + "\",\"password\":\"secret-student\"}"))
          .andExpect(status().isServiceUnavailable())
          .andExpect(jsonPath("$.ok").value(false));

      // admins are never locked out
      loginToken(admin.getEmail(), "secret-admin");
    } finally {
      mvc.perform(patch("/api/admin/settings").header("Authorization", "Bearer " + at)
              .contentType(MediaType.APPLICATION_JSON)
              .content("{\"selfRegistration\":true,\"maintenanceMode\":false}"))
          .andExpect(status().isOk());
    }
  }

  @Test
  void wipeInstanceKeepsOnlyPrimaryAdmin() throws Exception {
    // bootstrap runner seeds the primary admin into the empty test DB
    String keeper = "learnhub.edu.in@gmail.com";
    loginToken(keeper, "learnhub17");

    String victim = "victim." + System.nanoTime() + "@learnhub.test";
    mvc.perform(post("/api/users").header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Victim\",\"email\":\"" + victim
                + "\",\"password\":\"victim-pass\",\"role\":\"student\"}"))
        .andExpect(status().isCreated());

    // students cannot wipe
    mvc.perform(post("/api/admin/wipe").header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isForbidden());

    mvc.perform(post("/api/admin/wipe").header("Authorization", "Bearer " + token(admin)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.usersRemaining").value(1));

    // victim and seeded users are gone, keeper logs in
    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + victim + "\",\"password\":\"victim-pass\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(false));
    loginToken(keeper, "learnhub17");
    assertEquals(1, users.count());
  }

  private String refreshOf(String body) {
    int at = body.indexOf("\"refreshToken\":\"") + 16;
    return body.substring(at, body.indexOf('"', at));
  }

  @Test
  void refreshRotationRevocationAndLogoutAll() throws Exception {
    MvcResult r = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + student.getEmail() + "\",\"password\":\"secret-student\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.refreshToken").exists())
        .andReturn();
    String rt1 = refreshOf(r.getResponse().getContentAsString());

    // rotate: fresh pair, different refresh token
    MvcResult r2 = mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt1 + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.refreshToken").exists())
        .andReturn();
    String rt2 = refreshOf(r2.getResponse().getContentAsString());
    org.junit.jupiter.api.Assertions.assertNotEquals(rt1, rt2);

    // reuse of the spent token burns the whole family
    mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt1 + "\"}"))
        .andExpect(status().isUnauthorized());
    mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt2 + "\"}"))
        .andExpect(status().isUnauthorized());

    // garbage token rejected
    mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"junk\"}"))
        .andExpect(status().isUnauthorized());

    // fresh pair: logout revokes, logout-all revokes everything
    MvcResult r3 = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + student.getEmail() + "\",\"password\":\"secret-student\"}"))
        .andReturn();
    String rt3 = refreshOf(r3.getResponse().getContentAsString());
    mvc.perform(post("/api/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt3 + "\"}"))
        .andExpect(status().isOk());
    mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt3 + "\"}"))
        .andExpect(status().isUnauthorized());

    MvcResult r4 = mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + student.getEmail() + "\",\"password\":\"secret-student\"}"))
        .andReturn();
    String rt4 = refreshOf(r4.getResponse().getContentAsString());
    String body4 = r4.getResponse().getContentAsString();
    int at = body4.indexOf("\"token\":\"") + 9;
    String access4 = body4.substring(at, body4.indexOf('"', at));
    mvc.perform(post("/api/auth/logout-all")
            .header("Authorization", "Bearer " + access4))
        .andExpect(status().isOk());
    mvc.perform(post("/api/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"refreshToken\":\"" + rt4 + "\"}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void suspendedTokenDeniedEverywhere() throws Exception {
    mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token(suspended)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.suspended").value(true));
  }

  @Test
  void authMeAndLogout() throws Exception {
    mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value(student.getEmail()));

    mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));
  }

  @Test
  void profileUpdateAndDuplicateEmail() throws Exception {
    mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Renamed Student\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Renamed Student"));

    mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + admin.getEmail() + "\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));

    mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"not-an-email\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void passwordChangeRequiresCurrent() throws Exception {
    mvc.perform(post("/api/users/me/password").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"current\":\"wrong\",\"next\":\"new-secret\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));

    mvc.perform(post("/api/users/me/password").header("Authorization", "Bearer " + token(student))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"current\":\"secret-student\",\"next\":\"new-secret\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));

    loginToken(student.getEmail(), "new-secret");
  }

  @Test
  void studentForbiddenOnAdminSearch() throws Exception {
    mvc.perform(get("/api/users").header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isForbidden());

    mvc.perform(get("/api/users?role=student")
            .header("Authorization", "Bearer " + token(admin)))
        .andExpect(status().isOk())
        .andExpect(header().exists("X-Total-Count"))
        .andExpect(jsonPath("$.data").isArray());
  }

  @Test
  void userDetailGuards() throws Exception {
    // self
    mvc.perform(get("/api/users/" + student.getId())
            .header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isOk());
    // cross-student read denied
    mvc.perform(get("/api/users/" + stranger.getId())
            .header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isForbidden());
    // faculty reads own-course student
    mvc.perform(get("/api/users/" + student.getId())
            .header("Authorization", "Bearer " + token(faculty)))
        .andExpect(status().isOk());
    // faculty cannot read unenrolled stranger
    mvc.perform(get("/api/users/" + stranger.getId())
            .header("Authorization", "Bearer " + token(faculty)))
        .andExpect(status().isForbidden());
    // admin reads anyone
    mvc.perform(get("/api/users/" + stranger.getId())
            .header("Authorization", "Bearer " + token(admin)))
        .andExpect(status().isOk());
  }

  @Test
  void roleAndStatusChangeAudited() throws Exception {
    long before = events.count();

    mvc.perform(patch("/api/users/" + stranger.getId() + "/role")
            .header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"role\":\"faculty\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("faculty"));

    mvc.perform(patch("/api/users/" + stranger.getId() + "/status")
            .header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"suspended\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("suspended"));

    // toggle back to active (no status field)
    mvc.perform(patch("/api/users/" + stranger.getId() + "/status")
            .header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("active"));

    assertTrue(events.count() >= before + 3, "role + suspend + reactivate audit rows");

    // suspended user from this flow cannot log in anymore (restore first)
    mvc.perform(patch("/api/users/" + stranger.getId() + "/role")
            .header("Authorization", "Bearer " + token(admin))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"role\":\"student\"}"))
        .andExpect(status().isOk());
  }

  @Test
  void directoriesFiltered() throws Exception {
    mvc.perform(get("/api/students?query=" + student.getEmail())
            .header("Authorization", "Bearer " + token(admin)))
        .andExpect(status().isOk())
        .andExpect(header().exists("X-Total-Count"))
        .andExpect(jsonPath("$.data[0].courses").value(1));

    mvc.perform(get("/api/faculty?dept=Computer")
            .header("Authorization", "Bearer " + token(admin)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray());

    mvc.perform(get("/api/students").header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isForbidden());
  }

  @Test
  void unauthenticatedIs401() throws Exception {
    mvc.perform(get("/api/users/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.ok").value(false));
    mvc.perform(get("/api/auth/me"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void avatarUploadRoundTrip() throws Exception {
    org.springframework.mock.web.MockMultipartFile png =
        new org.springframework.mock.web.MockMultipartFile("file", "me.png", "image/png", "PNGDATA".getBytes());
    MvcResult r = mvc.perform(multipart("/api/users/me/avatar").file(png)
            .header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.avatarUrl").exists())
        .andReturn();
    String url = r.getResponse().getContentAsString().split("\"avatarUrl\":\"")[1].split("\"")[0];
    org.junit.jupiter.api.Assertions.assertTrue(url.startsWith("/api/files/"));

    org.springframework.mock.web.MockMultipartFile txt =
        new org.springframework.mock.web.MockMultipartFile("file", "x.txt", "text/plain", "hi".getBytes());
    mvc.perform(multipart("/api/users/me/avatar").file(txt)
            .header("Authorization", "Bearer " + token(student)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void validationErrorsAre400() throws Exception {
    mvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"bad\",\"password\":\"x\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false))
        .andExpect(jsonPath("$.error", containsString("email")));
  }
}
