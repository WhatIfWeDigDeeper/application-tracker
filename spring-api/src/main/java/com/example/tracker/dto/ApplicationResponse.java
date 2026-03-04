package com.example.tracker.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ApplicationResponse(
    UUID id,
    String companyName,
    String positionTitle,
    String status,
    LocalDate dateApplied,
    String companyUrl,
    String jobPostingUrl,
    String companyCareerUrl,
    String companyCategory,
    Integer skillsMatch,
    String jobSource,
    Integer salaryMin,
    Integer salaryMax,
    Boolean coverLetterRequired,
    LocalDate offerDueDate,
    String specialRequirements,
    String notes,
    boolean isArchived,
    List<InterviewStageResponse> interviewStages,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
