package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequest {

    @NotNull
    private Long assignmentId;

    @NotNull
    private Long studentId;

    @Size(max = 255)
    private String fileName;

    @Size(max = 1000)
    private String fileUrl;
}