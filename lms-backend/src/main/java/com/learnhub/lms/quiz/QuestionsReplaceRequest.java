package com.learnhub.lms.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** PUT /api/quizzes/:id/questions body — full replacement set. */
public record QuestionsReplaceRequest(
    @NotNull(message = "questions is required") List<@Valid QuestionInput> questions) {
}
