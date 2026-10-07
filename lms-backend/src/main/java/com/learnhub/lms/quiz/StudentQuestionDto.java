package com.learnhub.lms.quiz;

import java.util.List;

/**
 * Student question shape — deliberately has NO answer field (answer-leak
 * test asserts its absence; plan §10.10).
 */
public record StudentQuestionDto(int position, String question, List<String> options) {

  public static StudentQuestionDto from(QuizQuestion q, List<String> options) {
    return new StudentQuestionDto(q.getPosition(), q.getQuestion(), options);
  }
}
