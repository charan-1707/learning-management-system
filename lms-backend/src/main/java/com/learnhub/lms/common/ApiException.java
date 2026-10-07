package com.learnhub.lms.common;

import org.springframework.http.HttpStatus;

/**
 * Business-rule failure → rendered as {@code 4xx {ok:false, error}}.
 * Mirrors today's DB.* messages (see plan §2.1) so the frontend switch is seamless.
 */
public class ApiException extends RuntimeException {

  private final HttpStatus status;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public static ApiException badRequest(String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, message);
  }

  public static ApiException notFound(String message) {
    return new ApiException(HttpStatus.NOT_FOUND, message);
  }

  public static ApiException forbidden(String message) {
    return new ApiException(HttpStatus.FORBIDDEN, message);
  }

  public static ApiException unauthorized(String message) {
    return new ApiException(HttpStatus.UNAUTHORIZED, message);
  }

  public static ApiException conflict(String message) {
    return new ApiException(HttpStatus.CONFLICT, message);
  }

  public static ApiException maintenance(String message) {
    return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, message);
  }
}
