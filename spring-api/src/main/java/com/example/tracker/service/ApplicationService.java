package com.example.tracker.service;

import com.example.tracker.dto.ApplicationRequest;
import com.example.tracker.dto.ApplicationResponse;
import com.example.tracker.dto.HistoryDiff;
import com.example.tracker.dto.HistoryEntry;
import com.example.tracker.dto.ImportError;
import com.example.tracker.dto.ImportResult;
import com.example.tracker.dto.InterviewStageRequest;
import com.example.tracker.dto.InterviewStageResponse;
import com.example.tracker.dto.PaginatedResponse;
import com.example.tracker.entity.Application;
import com.example.tracker.entity.ApplicationSnapshot;
import com.example.tracker.entity.ApplicationStatus;
import com.example.tracker.entity.CompanyCategory;
import com.example.tracker.entity.InterviewStage;
import com.example.tracker.entity.JobSource;
import com.example.tracker.repository.ApplicationRepository;
import com.example.tracker.repository.ApplicationSnapshotRepository;
import com.example.tracker.repository.InterviewStageRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationService {

    private static final List<String> DEFAULT_STAGE_NAMES = Arrays.asList(
        "Resume Screen", "Phone Screen", "Technical Interview",
        "System Design", "Behavioral Interview", "Final Round"
    );

    private final ApplicationRepository applicationRepository;
    private final InterviewStageRepository stageRepository;
    private final ApplicationSnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;

    public ApplicationService(
        ApplicationRepository applicationRepository,
        InterviewStageRepository stageRepository,
        ApplicationSnapshotRepository snapshotRepository,
        ObjectMapper objectMapper
    ) {
        this.applicationRepository = applicationRepository;
        this.stageRepository = stageRepository;
        this.snapshotRepository = snapshotRepository;
        this.objectMapper = objectMapper;
    }

    public PaginatedResponse<ApplicationResponse> list(
        List<String> status, List<String> companyCategory, List<String> jobSource,
        Integer skillsMatchMin, boolean includeArchived,
        String sortBy, String sortDir, int page, int limit
    ) {
        Sort sort = Sort.by(
            "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC,
            mapSortField(sortBy)
        );
        Pageable pageable = PageRequest.of(page - 1, limit, sort);

        Specification<Application> spec = Specification
            .where(includeArchived ? null : ApplicationSpecifications.isArchived(false))
            .and(ApplicationSpecifications.hasStatus(status))
            .and(ApplicationSpecifications.hasCategory(companyCategory))
            .and(ApplicationSpecifications.hasJobSource(jobSource))
            .and(ApplicationSpecifications.hasMinSkillsMatch(skillsMatchMin));

        Page<Application> result = applicationRepository.findAll(spec, pageable);
        List<ApplicationResponse> items = result.getContent().stream()
            .map(this::toResponse)
            .toList();
        return new PaginatedResponse<>(items, page, limit, result.getTotalElements());
    }

    public ApplicationResponse get(UUID id) {
        return toResponse(findById(id));
    }

    public ApplicationResponse create(ApplicationRequest req) {
        Application app = new Application();
        applyRequest(app, req);
        applicationRepository.save(app);
        captureSnapshot(app, "Created");
        return toResponse(app);
    }

    public ApplicationResponse update(UUID id, ApplicationRequest req) {
        Application app = findById(id);
        ApplicationStatus prevStatus = app.getStatus();
        applyRequest(app, req);

        if (prevStatus == ApplicationStatus.UNSUBMITTED
            && app.getStatus() != ApplicationStatus.UNSUBMITTED
            && app.getDateApplied() == null) {
            app.setDateApplied(LocalDate.now());
        }
        if (app.getStatus() == ApplicationStatus.UNSUBMITTED) {
            app.setDateApplied(null);
        }

        if (prevStatus != ApplicationStatus.INTERVIEWING
            && app.getStatus() == ApplicationStatus.INTERVIEWING
            && app.getInterviewStages().isEmpty()) {
            createDefaultStages(app);
        }

        applicationRepository.save(app);
        captureSnapshot(app, "Updated");
        return toResponse(app);
    }

    public void delete(UUID id) {
        Application app = findById(id);
        applicationRepository.delete(app);
    }

    public ApplicationResponse archive(UUID id) {
        Application app = findById(id);
        app.setArchived(true);
        applicationRepository.save(app);
        captureSnapshot(app, "Archived");
        return toResponse(app);
    }

    public ApplicationResponse restore(UUID id) {
        Application app = findById(id);
        app.setArchived(false);
        applicationRepository.save(app);
        captureSnapshot(app, "Restored from archive");
        return toResponse(app);
    }

    public ApplicationResponse addStage(UUID appId, InterviewStageRequest req) {
        Application app = findById(appId);
        InterviewStage stage = new InterviewStage();
        stage.setApplication(app);
        stage.setStageName(req.name());
        stage.setStageOrder(req.order());
        stage.setCompleted(req.isCompleted());
        if (req.completedDate() != null && !req.completedDate().isBlank()) {
            stage.setCompletedDate(LocalDate.parse(req.completedDate()));
        }
        stage.setNotes(req.notes());
        stage.setPerformanceRating(req.performanceRating());
        app.getInterviewStages().add(stage);
        applicationRepository.save(app);
        captureSnapshot(app, "Stage added");
        return toResponse(app);
    }

    public ApplicationResponse updateStage(UUID appId, UUID stageId, InterviewStageRequest req) {
        Application app = findById(appId);
        InterviewStage stage = app.getInterviewStages().stream()
            .filter(s -> s.getId().equals(stageId))
            .findFirst()
            .orElseThrow(() -> new EntityNotFoundException("Stage not found"));
        stage.setStageName(req.name());
        stage.setStageOrder(req.order());
        stage.setCompleted(req.isCompleted());
        if (req.completedDate() != null && !req.completedDate().isBlank()) {
            stage.setCompletedDate(LocalDate.parse(req.completedDate()));
        } else {
            stage.setCompletedDate(null);
        }
        stage.setNotes(req.notes());
        stage.setPerformanceRating(req.performanceRating());
        applicationRepository.save(app);
        captureSnapshot(app, "Stage updated");
        return toResponse(app);
    }

    public ApplicationResponse deleteStage(UUID appId, UUID stageId) {
        Application app = findById(appId);
        app.getInterviewStages().removeIf(s -> s.getId().equals(stageId));
        applicationRepository.save(app);
        captureSnapshot(app, "Stage removed");
        return toResponse(app);
    }

    public List<HistoryEntry> getHistory(UUID appId) {
        return snapshotRepository.findByApplicationIdOrderBySequenceNumberDesc(appId)
            .stream()
            .map(snap -> {
                List<HistoryDiff> diffs = computeDiffs(snap);
                return new HistoryEntry(snap.getId(), snap.getSequenceNumber(),
                    snap.getDescription(), diffs, snap.getCreatedAt());
            })
            .toList();
    }

    public ApplicationResponse restoreHistory(UUID appId, UUID snapshotId) {
        ApplicationSnapshot snapshot = snapshotRepository.findById(snapshotId)
            .orElseThrow(() -> new EntityNotFoundException("Snapshot not found"));
        Application app = findById(appId);

        try {
            ApplicationResponse restoredData = objectMapper.readValue(snapshot.getData(), ApplicationResponse.class);
            app.setCompanyName(restoredData.companyName());
            app.setPositionTitle(restoredData.positionTitle());
            app.setStatus(ApplicationStatus.valueOf(enumNameFromValue(restoredData.status())));
            app.setDateApplied(restoredData.dateApplied());
            app.setCompanyUrl(restoredData.companyUrl());
            app.setJobPostingUrl(restoredData.jobPostingUrl());
            app.setCompanyCareerUrl(restoredData.companyCareerUrl());
            app.setCompanyCategory(restoredData.companyCategory() != null
                ? CompanyCategory.valueOf(enumNameFromValue(restoredData.companyCategory())) : null);
            app.setSkillsMatch(restoredData.skillsMatch());
            app.setJobSource(restoredData.jobSource() != null
                ? JobSource.valueOf(enumNameFromValue(restoredData.jobSource())) : null);
            app.setSalaryMin(restoredData.salaryMin());
            app.setSalaryMax(restoredData.salaryMax());
            app.setCoverLetterRequired(restoredData.coverLetterRequired());
            app.setOfferDueDate(restoredData.offerDueDate());
            app.setSpecialRequirements(restoredData.specialRequirements());
            app.setNotes(restoredData.notes());
            applicationRepository.save(app);
            captureSnapshot(app, "Restored to version " + snapshot.getSequenceNumber());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to restore snapshot", e);
        }
        return toResponse(app);
    }

    public String exportCsv() {
        List<Application> apps = applicationRepository.findAll(
            Specification.where(ApplicationSpecifications.isArchived(false)),
            Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        StringBuilder sb = new StringBuilder();
        sb.append("companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired,offerDueDate,specialRequirements,notes\n");
        for (Application app : apps) {
            sb.append(csvEscape(app.getCompanyName())).append(",");
            sb.append(csvEscape(app.getPositionTitle())).append(",");
            sb.append(csvEscape(app.getStatus().getValue())).append(",");
            sb.append(csvEscape(app.getDateApplied() != null ? app.getDateApplied().toString() : "")).append(",");
            sb.append(csvEscape(app.getCompanyUrl())).append(",");
            sb.append(csvEscape(app.getJobPostingUrl())).append(",");
            sb.append(csvEscape(app.getCompanyCareerUrl())).append(",");
            sb.append(csvEscape(app.getCompanyCategory() != null ? app.getCompanyCategory().getValue() : "")).append(",");
            sb.append(app.getSkillsMatch() != null ? app.getSkillsMatch() : "").append(",");
            sb.append(csvEscape(app.getJobSource() != null ? app.getJobSource().getValue() : "")).append(",");
            sb.append(app.getSalaryMin() != null ? app.getSalaryMin() : "").append(",");
            sb.append(app.getSalaryMax() != null ? app.getSalaryMax() : "").append(",");
            sb.append(app.getCoverLetterRequired() != null ? app.getCoverLetterRequired() : "").append(",");
            sb.append(csvEscape(app.getOfferDueDate() != null ? app.getOfferDueDate().toString() : "")).append(",");
            sb.append(csvEscape(app.getSpecialRequirements())).append(",");
            sb.append(csvEscape(app.getNotes())).append("\n");
        }
        return sb.toString();
    }

    public String getSampleCsv() {
        return "companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl,companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired,offerDueDate,specialRequirements,notes\n"
            + "Acme Corp,Software Engineer,applied,2024-01-15,https://acme.com,https://acme.com/jobs/123,,ai,8,linkedin,120000,160000,false,,Java Spring experience preferred,Great team culture\n";
    }

    public ImportResult importCsv(String csvContent) {
        String[] lines = csvContent.split("\n");
        int imported = 0;
        int skipped = 0;
        List<ImportError> errors = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            int rowNum = i + 1;
            try {
                String[] cols = parseCsvLine(line);
                if (cols.length < 2) {
                    errors.add(new ImportError(rowNum, "Insufficient columns"));
                    continue;
                }
                String companyName = cols.length > 0 ? cols[0].trim() : "";
                String positionTitle = cols.length > 1 ? cols[1].trim() : "";
                String jobPostingUrl = cols.length > 5 ? cols[5].trim() : "";

                if (companyName.isEmpty()) {
                    errors.add(new ImportError(rowNum, "Company name is required"));
                    continue;
                }
                if (positionTitle.isEmpty()) {
                    errors.add(new ImportError(rowNum, "Position title is required"));
                    continue;
                }

                if (!jobPostingUrl.isEmpty()) {
                    if (seenUrls.contains(jobPostingUrl)) {
                        skipped++;
                        continue;
                    }
                    boolean exists = applicationRepository.findAll().stream()
                        .anyMatch(a -> jobPostingUrl.equals(a.getJobPostingUrl()));
                    if (exists) {
                        skipped++;
                        continue;
                    }
                    seenUrls.add(jobPostingUrl);
                }

                Application app = new Application();
                app.setCompanyName(companyName);
                app.setPositionTitle(positionTitle);
                if (cols.length > 2 && !cols[2].trim().isEmpty()) {
                    try {
                        app.setStatus(statusFromValue(cols[2].trim()));
                    } catch (Exception e) {
                        app.setStatus(ApplicationStatus.UNSUBMITTED);
                    }
                }
                if (cols.length > 3 && !cols[3].trim().isEmpty()) {
                    try { app.setDateApplied(LocalDate.parse(cols[3].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 4 && !cols[4].trim().isEmpty()) app.setCompanyUrl(cols[4].trim());
                if (!jobPostingUrl.isEmpty()) app.setJobPostingUrl(jobPostingUrl);
                if (cols.length > 6 && !cols[6].trim().isEmpty()) app.setCompanyCareerUrl(cols[6].trim());
                if (cols.length > 7 && !cols[7].trim().isEmpty()) {
                    try { app.setCompanyCategory(categoryFromValue(cols[7].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 8 && !cols[8].trim().isEmpty()) {
                    try { app.setSkillsMatch(Integer.parseInt(cols[8].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 9 && !cols[9].trim().isEmpty()) {
                    try { app.setJobSource(sourceFromValue(cols[9].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 10 && !cols[10].trim().isEmpty()) {
                    try { app.setSalaryMin(Integer.parseInt(cols[10].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 11 && !cols[11].trim().isEmpty()) {
                    try { app.setSalaryMax(Integer.parseInt(cols[11].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 12 && !cols[12].trim().isEmpty()) {
                    app.setCoverLetterRequired(Boolean.parseBoolean(cols[12].trim()));
                }
                if (cols.length > 13 && !cols[13].trim().isEmpty()) {
                    try { app.setOfferDueDate(LocalDate.parse(cols[13].trim())); } catch (Exception ignored) {}
                }
                if (cols.length > 14 && !cols[14].trim().isEmpty()) app.setSpecialRequirements(cols[14].trim());
                if (cols.length > 15 && !cols[15].trim().isEmpty()) app.setNotes(cols[15].trim());

                applicationRepository.save(app);
                captureSnapshot(app, "Imported from CSV");
                imported++;
            } catch (Exception e) {
                errors.add(new ImportError(rowNum, e.getMessage()));
            }
        }
        return new ImportResult(imported, skipped, errors);
    }

    private Application findById(UUID id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));
    }

    private void applyRequest(Application app, ApplicationRequest req) {
        app.setCompanyName(req.companyName());
        app.setPositionTitle(req.positionTitle());
        if (req.status() != null) {
            app.setStatus(statusFromValue(req.status()));
        }
        app.setDateApplied(req.dateApplied());
        app.setCompanyUrl(req.companyUrl());
        app.setJobPostingUrl(req.jobPostingUrl());
        app.setCompanyCareerUrl(req.companyCareerUrl());
        app.setCompanyCategory(req.companyCategory() != null && !req.companyCategory().isBlank()
            ? categoryFromValue(req.companyCategory()) : null);
        app.setSkillsMatch(req.skillsMatch());
        app.setJobSource(req.jobSource() != null && !req.jobSource().isBlank()
            ? sourceFromValue(req.jobSource()) : null);
        app.setSalaryMin(req.salaryMin());
        app.setSalaryMax(req.salaryMax());
        app.setCoverLetterRequired(req.coverLetterRequired());
        app.setOfferDueDate(req.offerDueDate());
        app.setSpecialRequirements(req.specialRequirements());
        app.setNotes(req.notes());
    }

    private void createDefaultStages(Application app) {
        for (int i = 0; i < DEFAULT_STAGE_NAMES.size(); i++) {
            InterviewStage stage = new InterviewStage();
            stage.setApplication(app);
            stage.setStageName(DEFAULT_STAGE_NAMES.get(i));
            stage.setStageOrder(i);
            stage.setCompleted(false);
            app.getInterviewStages().add(stage);
        }
    }

    private void captureSnapshot(Application app, String description) {
        try {
            int seq = snapshotRepository.findMaxSequenceNumber(app.getId()) + 1;
            ApplicationSnapshot snapshot = new ApplicationSnapshot();
            snapshot.setApplicationId(app.getId());
            snapshot.setSequenceNumber(seq);
            snapshot.setDescription(description);
            snapshot.setData(objectMapper.writeValueAsString(toResponse(app)));
            snapshotRepository.save(snapshot);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to capture snapshot", e);
        }
    }

    private List<HistoryDiff> computeDiffs(ApplicationSnapshot snap) {
        List<ApplicationSnapshot> history =
            snapshotRepository.findByApplicationIdOrderBySequenceNumberDesc(snap.getApplicationId());
        ApplicationSnapshot prev = history.stream()
            .filter(s -> s.getSequenceNumber() < snap.getSequenceNumber())
            .findFirst()
            .orElse(null);
        if (prev == null) return List.of();
        try {
            Map<?, ?> current = objectMapper.readValue(snap.getData(), Map.class);
            Map<?, ?> previous = objectMapper.readValue(prev.getData(), Map.class);
            List<HistoryDiff> diffs = new ArrayList<>();
            for (Object key : current.keySet()) {
                if ("interviewStages".equals(key) || "createdAt".equals(key)
                    || "updatedAt".equals(key) || "id".equals(key)) continue;
                Object currVal = current.get(key);
                Object prevVal = previous.get(key);
                String currStr = currVal != null ? currVal.toString() : null;
                String prevStr = prevVal != null ? prevVal.toString() : null;
                if (!Objects.equals(currStr, prevStr)) {
                    String fieldName = key.toString();
                    String label = fieldToLabel(fieldName);
                    diffs.add(new HistoryDiff(fieldName, label, prevStr, currStr));
                }
            }
            return diffs;
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String fieldToLabel(String field) {
        String spaced = field.replaceAll("([A-Z])", " $1");
        if (spaced.isEmpty()) return field;
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }

    private ApplicationResponse toResponse(Application app) {
        List<InterviewStageResponse> stages = app.getInterviewStages().stream()
            .sorted(Comparator.comparingInt(InterviewStage::getStageOrder))
            .map(s -> new InterviewStageResponse(
                s.getId(), app.getId(),
                s.getStageName(), s.getStageOrder(),
                s.isCompleted(), s.getCompletedDate(),
                s.getNotes(), s.getPerformanceRating()
            ))
            .toList();
        return new ApplicationResponse(
            app.getId(), app.getCompanyName(), app.getPositionTitle(),
            app.getStatus().getValue(),
            app.getDateApplied(), app.getCompanyUrl(), app.getJobPostingUrl(),
            app.getCompanyCareerUrl(),
            app.getCompanyCategory() != null ? app.getCompanyCategory().getValue() : null,
            app.getSkillsMatch(),
            app.getJobSource() != null ? app.getJobSource().getValue() : null,
            app.getSalaryMin(), app.getSalaryMax(), app.getCoverLetterRequired(),
            app.getOfferDueDate(), app.getSpecialRequirements(), app.getNotes(),
            app.isArchived(), stages, app.getCreatedAt(), app.getUpdatedAt()
        );
    }

    private ApplicationStatus statusFromValue(String value) {
        for (ApplicationStatus s : ApplicationStatus.values()) {
            if (s.getValue().equals(value)) return s;
        }
        throw new IllegalArgumentException("Unknown status: " + value);
    }

    private CompanyCategory categoryFromValue(String value) {
        for (CompanyCategory c : CompanyCategory.values()) {
            if (c.getValue().equals(value)) return c;
        }
        throw new IllegalArgumentException("Unknown category: " + value);
    }

    private JobSource sourceFromValue(String value) {
        for (JobSource s : JobSource.values()) {
            if (s.getValue().equals(value)) return s;
        }
        throw new IllegalArgumentException("Unknown source: " + value);
    }

    private String enumNameFromValue(String value) {
        return value.toUpperCase().replace(" ", "_").replace("-", "_");
    }

    private String mapSortField(String sortBy) {
        if (sortBy == null) return "updatedAt";
        return switch (sortBy) {
            case "dateApplied" -> "dateApplied";
            case "companyName" -> "companyName";
            default -> "updatedAt";
        };
    }

    private String csvEscape(String value) {
        if (value == null || value.isEmpty()) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result.toArray(new String[0]);
    }
}
