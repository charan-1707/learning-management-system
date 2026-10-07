package com.learnhub.lms.quiz;

import java.util.List;

/** Full question shape — owner/ADMIN only (contains the answer index). */
public record QuestionDto(int position, String question, List<String> options, int answer) {

  public static QuestionDto from(QuizQuestion q, List<String> options) {
    return new QuestionDto(q.getPosition(), q.getQuestion(), options, q.getAnswerIndex());
  }
}
