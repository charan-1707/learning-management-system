package com.learnhub.lms.dto.request;

import com.learnhub.lms.enums.AssignmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 3000)
    private String description;

    @NotNull
    private LocalDateTime dueDate;

    @NotNull
    @Positive
    private BigDecimal maxMarks;

    private AssignmentStatus status = AssignmentStatus.PUBLISHED;
}