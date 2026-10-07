package com.learnhub.lms.common;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Cross-cutting error shape (plan §13.2): every failure is
 * {@code {ok:false, error}} — never a stack trace.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
    return ResponseEntity.status(ex.getStatus())
        .body(Map.of("ok", false, "error", ex.getMessage()));
  }

  @ExceptionHandler({EntityNotFoundException.class})
  public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(Map.of("ok", false, "error", ex.getMessage()));
  }

  @ExceptionHandler({AccessDeniedException.class})
  public ResponseEntity<Map<String, Object>> handleDenied(AccessDeniedException ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(Map.of("ok", false, "error", "Forbidden"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {    String first = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(f -> f.getField() + " " + f.getDefaultMessage())
        .orElse("Validation failed");
    return ResponseEntity.badRequest().body(Map.of("ok", false, "error", first));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
    return ResponseEntity.badRequest().body(Map.of("ok", false, "error", "Malformed request body"));
  }
}
