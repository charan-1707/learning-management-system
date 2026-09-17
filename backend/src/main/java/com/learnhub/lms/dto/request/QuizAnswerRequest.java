package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswerRequest {

    @NotNull
    private Long questionId;

    @Size(max = 1)
    @Pattern(regexp = "[ABCD]?", message = "selectedOption must be A, B, C, D or empty")
    private String selectedOption;
}