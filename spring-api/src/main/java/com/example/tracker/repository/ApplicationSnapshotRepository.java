package com.example.tracker.repository;

import com.example.tracker.entity.ApplicationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ApplicationSnapshotRepository extends JpaRepository<ApplicationSnapshot, UUID> {
    List<ApplicationSnapshot> findByApplicationIdOrderBySequenceNumberDesc(UUID applicationId);

    @Query("SELECT COALESCE(MAX(s.sequenceNumber), 0) FROM ApplicationSnapshot s WHERE s.applicationId = :applicationId")
    int findMaxSequenceNumber(UUID applicationId);
}
