package com.example.tracker.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InterviewStageRequest(
    @NotBlank @Size(max = 200) String name,
    int order,
    boolean isCompleted,
    String completedDate,
    String notes,
    @Min(1) @Max(5) Integer performanceRating
) {}
