package com.learnhub.lms.dto.request;

import com.learnhub.lms.enums.CourseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    @Size(max = 50)
    private String code;

    @Size(max = 2000)
    private String description;

    @Size(max = 100)
    private String category;

    private CourseStatus status = CourseStatus.DRAFT;
}