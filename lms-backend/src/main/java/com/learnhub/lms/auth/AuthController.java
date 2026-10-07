package com.learnhub.lms.auth;

import com.learnhub.lms.common.Authz;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Auth & session (plan §9.1). Login/logout are public; /me needs the JWT. */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "auth", description = "Login, session, logout")
public class AuthController {

  private final AuthService auth;
  private final PasswordResetService resets;
  private final RefreshService sessions;
  private final OtpService otp;
  private final Authz authz;

  public AuthController(AuthService auth, PasswordResetService resets,
      RefreshService sessions, OtpService otp, Authz authz) {
    this.auth = auth;
    this.resets = resets;
    this.sessions = sessions;
    this.otp = otp;
    this.authz = authz;
  }

  @PostMapping("/login")
  @Operation(summary = "Demo-compatible login: 200 {ok:false} on bad credentials, 403 {suspended:true} when suspended")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
    return auth.login(req.email(), req.password());
  }

  @PostMapping("/register")
  @Operation(summary = "Public student signup (201 + pending email; no tokens until the OTP is verified; 409 when the email is taken)")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
    return auth.register(req.name(), req.email(), req.password());
  }

  @PostMapping("/verify-otp")
  @Operation(summary = "Consume a 6-digit email code; on success returns login tokens (first login)")
  public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
    return auth.verifyOtp(req.email(), req.code());
  }

  @PostMapping("/resend-otp")
  @Operation(summary = "Re-send a verification code (always ok:true; 60s cooldown)")
  public Map<String, Object> resendOtp(@Valid @RequestBody ResendOtpRequest req) {
    return otp.resend(req.email());
  }

  @PostMapping("/forgot-password")
  @Operation(summary = "Email a reset link (always ok:true; 15-minute single-use token)")
  public Map<String, Object> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
    return resets.forgotPassword(req.email());
  }

  @PostMapping("/reset-password")
  @Operation(summary = "Consume a reset token and set a new password")
  public Map<String, Object> reset(@Valid @RequestBody ResetPasswordRequest req) {
    return resets.resetPassword(req.token(), req.newPassword());
  }

  @GetMapping("/me")
  @Operation(summary = "Current session user (JWT required)")
  public MeDto me() {
    return auth.me(authz.currentUserId());
  }

  @PostMapping("/logout")
  @Operation(summary = "Stateless logout — client drops the token")
  public Map<String, Object> logout(@RequestBody(required = false) RefreshRequest req) {
    return sessions.logout(req == null ? null : req.refreshToken());
  }

  @PostMapping("/refresh")
  @Operation(summary = "Rotate a refresh token into a fresh access + refresh pair")
  public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest req) {
    return sessions.refresh(req == null ? null : req.refreshToken());
  }

  @PostMapping("/logout-all")
  @Operation(summary = "Revoke every refresh token (all devices)")
  public Map<String, Object> logoutAll() {
    return sessions.logoutAll(authz.currentUserId());
  }
}
