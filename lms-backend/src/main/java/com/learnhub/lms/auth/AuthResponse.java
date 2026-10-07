package com.learnhub.lms.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.learnhub.lms.user.UserDto;

/**
 * Mirrors the frontend demo contract: wrong password is still HTTP 200 with
 * {@code ok:false}; suspended is HTTP 403 with {@code suspended:true};
 * unverified login is HTTP 200 with {@code unverified:true}; a fresh
 * registration answers 201 with the pending {@code email} and no tokens.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(boolean ok, String token, String refreshToken, UserDto user,
    Boolean suspended, Boolean unverified, String email) {

  public static AuthResponse success(String token, UserDto user) {
    return new AuthResponse(true, token, null, user, null, null, null);
  }

  public static AuthResponse success(String token, String refreshToken, UserDto user) {
    return new AuthResponse(true, token, refreshToken, user, null, null, null);
  }

  public static AuthResponse failed() {
    return new AuthResponse(false, null, null, null, null, null, null);
  }

  public static AuthResponse suspendedDenied() {
    return new AuthResponse(false, null, null, null, true, null, null);
  }

  public static AuthResponse unverifiedDenied() {
    return new AuthResponse(false, null, null, null, null, true, null);
  }

  public static AuthResponse pendingVerification(String email) {
    return new AuthResponse(true, null, null, null, null, null, email);
  }
}
