package com.example.tracker.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ApplicationRequest(
    @NotBlank @Size(max = 200) String companyName,
    @NotBlank @Size(max = 200) String positionTitle,
    String status,
    LocalDate dateApplied,
    @Size(max = 500) String companyUrl,
    @Size(max = 500) String jobPostingUrl,
    @Size(max = 500) String companyCareerUrl,
    String companyCategory,
    @Min(1) @Max(10) Integer skillsMatch,
    String jobSource,
    Integer salaryMin,
    Integer salaryMax,
    Boolean coverLetterRequired,
    LocalDate offerDueDate,
    String specialRequirements,
    String notes
) {}
