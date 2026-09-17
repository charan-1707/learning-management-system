package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionRequest {

    @NotBlank
    @Size(max = 1000)
    private String questionText;

    @NotBlank
    @Size(max = 500)
    private String optionA;

    @NotBlank
    @Size(max = 500)
    private String optionB;

    @NotBlank
    @Size(max = 500)
    private String optionC;

    @NotBlank
    @Size(max = 500)
    private String optionD;

    @NotBlank
    @Pattern(regexp = "[ABCD]", message = "correctOption must be A, B, C or D")
    private String correctOption;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal marks;

    private Integer displayOrder;
}