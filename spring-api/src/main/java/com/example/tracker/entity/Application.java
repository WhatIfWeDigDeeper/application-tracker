package com.example.tracker.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.Type;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications", schema = "java_spring")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name", nullable = false, length = 500)
    private String companyName;

    @Column(name = "position_title", nullable = false, length = 500)
    private String positionTitle;

    @Type(ApplicationStatusUserType.class)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status = ApplicationStatus.UNSUBMITTED;

    @Column(name = "date_applied")
    private LocalDate dateApplied;

    @Column(name = "company_url", columnDefinition = "TEXT")
    private String companyUrl;

    @Column(name = "job_posting_url", columnDefinition = "TEXT")
    private String jobPostingUrl;

    @Column(name = "company_career_url", columnDefinition = "TEXT")
    private String companyCareerUrl;

    @Type(CompanyCategoryUserType.class)
    @Column(name = "company_category")
    private CompanyCategory companyCategory;

    @Column(name = "skills_match")
    private Integer skillsMatch;

    @Type(JobSourceUserType.class)
    @Column(name = "job_source")
    private JobSource jobSource;

    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(name = "cover_letter_required")
    private Boolean coverLetterRequired = false;

    @Column(name = "offer_due_date")
    private LocalDate offerDueDate;

    @Column(name = "special_requirements", columnDefinition = "TEXT")
    private String specialRequirements;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "is_archived", nullable = false)
    private boolean archived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("stageOrder ASC")
    private List<InterviewStage> interviewStages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public LocalDate getDateApplied() { return dateApplied; }
    public void setDateApplied(LocalDate dateApplied) { this.dateApplied = dateApplied; }

    public String getCompanyUrl() { return companyUrl; }
    public void setCompanyUrl(String companyUrl) { this.companyUrl = companyUrl; }

    public String getJobPostingUrl() { return jobPostingUrl; }
    public void setJobPostingUrl(String jobPostingUrl) { this.jobPostingUrl = jobPostingUrl; }

    public String getCompanyCareerUrl() { return companyCareerUrl; }
    public void setCompanyCareerUrl(String companyCareerUrl) { this.companyCareerUrl = companyCareerUrl; }

    public CompanyCategory getCompanyCategory() { return companyCategory; }
    public void setCompanyCategory(CompanyCategory companyCategory) { this.companyCategory = companyCategory; }

    public Integer getSkillsMatch() { return skillsMatch; }
    public void setSkillsMatch(Integer skillsMatch) { this.skillsMatch = skillsMatch; }

    public JobSource getJobSource() { return jobSource; }
    public void setJobSource(JobSource jobSource) { this.jobSource = jobSource; }

    public Integer getSalaryMin() { return salaryMin; }
    public void setSalaryMin(Integer salaryMin) { this.salaryMin = salaryMin; }

    public Integer getSalaryMax() { return salaryMax; }
    public void setSalaryMax(Integer salaryMax) { this.salaryMax = salaryMax; }

    public Boolean getCoverLetterRequired() { return coverLetterRequired; }
    public void setCoverLetterRequired(Boolean coverLetterRequired) { this.coverLetterRequired = coverLetterRequired; }

    public LocalDate getOfferDueDate() { return offerDueDate; }
    public void setOfferDueDate(LocalDate offerDueDate) { this.offerDueDate = offerDueDate; }

    public String getSpecialRequirements() { return specialRequirements; }
    public void setSpecialRequirements(String specialRequirements) { this.specialRequirements = specialRequirements; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<InterviewStage> getInterviewStages() { return interviewStages; }
    public void setInterviewStages(List<InterviewStage> interviewStages) { this.interviewStages = interviewStages; }
}
