package com.example.tracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "interview_stages", schema = "java_spring")
public class InterviewStage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "stage_name", nullable = false, length = 200)
    private String stageName;

    @Column(name = "stage_order", nullable = false)
    private int stageOrder;

    @Column(name = "is_completed", nullable = false)
    private boolean completed = false;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "performance_rating")
    private Integer performanceRating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public int getStageOrder() { return stageOrder; }
    public void setStageOrder(int stageOrder) { this.stageOrder = stageOrder; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getPerformanceRating() { return performanceRating; }
    public void setPerformanceRating(Integer performanceRating) { this.performanceRating = performanceRating; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
