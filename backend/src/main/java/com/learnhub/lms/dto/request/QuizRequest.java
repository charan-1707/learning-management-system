package com.learnhub.lms.dto.request;

import com.learnhub.lms.enums.QuizStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 3000)
    private String description;

    @NotNull
    @Positive
    private Integer durationMinutes;

    @NotNull
    @Positive
    private Integer maxAttempts = 1;

    private QuizStatus status = QuizStatus.DRAFT;

    private List<QuizQuestionRequest> questions = new ArrayList<>();
}