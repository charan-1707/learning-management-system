package com.learnhub.lms.quiz;

import com.learnhub.lms.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Quizzes + attempts (plan §9.7). Scoring is server-side; answers are stripped for students. */
@RestController
@RequestMapping("/api/quizzes")
@Tag(name = "quizzes", description = "Quizzes, questions and attempts")
public class QuizController {

  private final QuizService service;

  public QuizController(QuizService service) {
    this.service = service;
  }

  @GetMapping
  @Operation(summary = "Quiz list; taken is per-student (optional ?courseId=&taken=)")
  public ResponseEntity<PageResponse<QuizDto>> list(
      @RequestParam(required = false) String courseId,
      @RequestParam(required = false) Boolean taken,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageResponse<QuizDto> body = service.list(courseId, taken, page, size);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.total())).body(body);
  }

  @PostMapping
  @Operation(summary = "Create quiz (owner/ADMIN of the course)")
  public ResponseEntity<QuizDto> create(@Valid @RequestBody QuizCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Quiz header (enrolled/owner/admin)")
  public QuizDto get(@PathVariable String id) {
    return service.get(id);
  }

  @PatchMapping("/{id}")
  @Operation(summary = "Update quiz header (owner/ADMIN)")
  public QuizDto update(@PathVariable String id,
      @Valid @RequestBody QuizUpdateRequest req) {
    return service.update(id, req);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Delete quiz with questions+attempts (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    service.delete(id);
    return Map.of("ok", true);
  }

  @GetMapping("/{id}/questions")
  @Operation(summary = "Questions: full for owner/ADMIN, answer-stripped for students")
  public List<?> questions(@PathVariable String id) {
    return service.questions(id);
  }

  @PutMapping("/{id}/questions")
  @Operation(summary = "Replace all questions (owner/ADMIN)")
  public List<QuestionDto> replace(@PathVariable String id,
      @Valid @RequestBody QuestionsReplaceRequest req) {
    return service.replaceQuestions(id, req);
  }

  @PostMapping("/{id}/attempts")
  @Operation(summary = "Submit attempt, server-scored (self, NEW)")
  public ResponseEntity<AttemptResult> attempt(@PathVariable String id,
      @Valid @RequestBody AttemptRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.attempt(id, req));
  }

  @GetMapping("/{id}/attempts/me")
  @Operation(summary = "Own attempt history (self)")
  public List<AttemptDto> mine(@PathVariable String id) {
    return service.myAttempts(id);
  }

  @GetMapping("/{id}/attempts")
  @Operation(summary = "All attempts with students (owner/ADMIN)")
  public List<AttemptDto> all(@PathVariable String id) {
    return service.attemptsForQuiz(id);
  }
}
