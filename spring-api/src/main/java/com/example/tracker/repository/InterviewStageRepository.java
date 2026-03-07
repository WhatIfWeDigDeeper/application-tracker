package com.example.tracker.repository;

import com.example.tracker.entity.InterviewStage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface InterviewStageRepository extends JpaRepository<InterviewStage, UUID> {
    List<InterviewStage> findByApplicationIdOrderByStageOrderAsc(UUID applicationId);
}
