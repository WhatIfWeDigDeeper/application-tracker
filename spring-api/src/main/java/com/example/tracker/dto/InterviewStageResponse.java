package com.example.tracker.dto;

import java.time.LocalDate;
import java.util.UUID;

public record InterviewStageResponse(
    UUID id,
    UUID applicationId,
    String name,
    int order,
    boolean isCompleted,
    LocalDate completedDate,
    String notes,
    Integer performanceRating
) {}
