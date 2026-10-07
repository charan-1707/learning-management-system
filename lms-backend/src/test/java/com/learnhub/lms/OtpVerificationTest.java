package com.learnhub.lms;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.learnhub.lms.auth.EmailOtp;
import com.learnhub.lms.auth.EmailOtpRepository;
import com.learnhub.lms.auth.OtpService;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.UserStatus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Email OTP verification (plan §12 addendum) on H2: lockout after 5 wrong
 * attempts, expiry, resend cooldown and unknown-email silence.
 */
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureMockMvc
class OtpVerificationTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired EmailOtpRepository codes;
  @Autowired OtpService otp;
  @Autowired PasswordEncoder passwords;

  private User mkUnverified(String kind) {
    User u = new User();
    u.setName("OTP " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("pw"));
    u.setRole(Role.student);
    u.setStatus(UserStatus.active);
    u.setEmailVerified(false);
    return users.saveAndFlush(u);
  }

  private String body(String email, String code) {
    return "{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}";
  }

  private EmailOtp liveRow(User u) {
    return codes.findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(u.getId())
        .orElseThrow();
  }

  @Test
  void lockoutAfterFiveWrongAttempts() throws Exception {
    User u = mkUnverified("lock");
    otp.issueCode(u);
    for (int i = 0; i < 4; i++) {
      mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
              .content(body(u.getEmail(), "000000")))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("attempts left")));
    }
    mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
            .content(body(u.getEmail(), "000000")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Too many wrong attempts")));
    // the right code is dead after lockout
    mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
            .content(body(u.getEmail(), "000001")))
        .andExpect(status().isBadRequest());
  }

  @Test
  void expiredCodeRejected() throws Exception {
    User u = mkUnverified("exp");
    String code = otp.issueCode(u);
    EmailOtp row = liveRow(u);
    row.setExpiresAt(LocalDateTime.now().minusMinutes(1));
    codes.saveAndFlush(row);
    mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
            .content(body(u.getEmail(), code)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void resendCooldownAndUnknownSilence() throws Exception {
    User u = mkUnverified("cool");
    otp.issueCode(u);
    // immediate resend trips the 60s cooldown
    mvc.perform(post("/api/auth/resend-otp").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + u.getEmail() + "\"}"))
        .andExpect(status().isBadRequest());
    // unknown email still answers ok (no enumeration)
    mvc.perform(post("/api/auth/resend-otp").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"nobody." + System.nanoTime() + "@learnhub.test\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));
  }
}
