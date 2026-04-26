package com.example.tracker.service;

import com.example.tracker.dto.ApplicationRequest;
import com.example.tracker.entity.Application;
import com.example.tracker.entity.ApplicationStatus;
import com.example.tracker.repository.ApplicationRepository;
import com.example.tracker.repository.ApplicationSnapshotRepository;
import com.example.tracker.repository.InterviewStageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private InterviewStageRepository stageRepository;
    @Mock
    private ApplicationSnapshotRepository snapshotRepository;

    private ApplicationService service;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        PlatformTransactionManager txManager = mock(PlatformTransactionManager.class);
        service = new ApplicationService(applicationRepository, stageRepository, snapshotRepository, mapper, txManager);
    }

    @Test
    void createSavesApplicationAndCreatesSnapshot() {
        Application saved = new Application();
        saved.setId(UUID.randomUUID());
        saved.setCompanyName("Acme");
        saved.setPositionTitle("Engineer");
        saved.setStatus(ApplicationStatus.UNSUBMITTED);
        saved.setInterviewStages(new ArrayList<>());

        when(applicationRepository.saveAndFlush(any())).thenReturn(saved);
        when(snapshotRepository.findMaxSequenceNumber(any())).thenReturn(0);
        when(snapshotRepository.save(any())).thenReturn(null);

        var req = new ApplicationRequest("Acme", "Engineer", "unsubmitted", null,
            null, null, null, null, null, null, null, null, null, null, null, null);
        var result = service.create(req);

        assertThat(result.companyName()).isEqualTo("Acme");
        verify(snapshotRepository).save(any());
    }

    @Test
    void updateTransitionToInterviewingCreatesDefaultStages() {
        Application app = new Application();
        app.setId(UUID.randomUUID());
        app.setCompanyName("Acme");
        app.setPositionTitle("Engineer");
        app.setStatus(ApplicationStatus.APPLIED);
        app.setInterviewStages(new ArrayList<>());

        when(applicationRepository.findById(any())).thenReturn(Optional.of(app));
        when(applicationRepository.saveAndFlush(any())).thenReturn(app);
        when(snapshotRepository.findMaxSequenceNumber(any())).thenReturn(0);
        when(snapshotRepository.save(any())).thenReturn(null);

        var req = new ApplicationRequest("Acme", "Engineer", "interviewing", null,
            null, null, null, null, null, null, null, null, null, null, null, null);
        service.update(app.getId(), req);

        assertThat(app.getInterviewStages()).hasSize(6);
    }
}
