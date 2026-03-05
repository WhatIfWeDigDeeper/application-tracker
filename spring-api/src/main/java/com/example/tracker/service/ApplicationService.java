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
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@Transactional
public class ApplicationService {

    private static final List<String> DEFAULT_STAGE_NAMES = List.of(
        "Resume Screen", "Phone Screen", "Technical Interview",
        "System Design", "Behavioral Interview", "Final Round"
    );

    private static final String CSV_HEADER =
        "companyName,positionTitle,status,dateApplied,companyUrl,jobPostingUrl,companyCareerUrl," +
        "companyCategory,skillsMatch,jobSource,salaryMin,salaryMax,coverLetterRequired," +
        "offerDueDate,specialRequirements,notes\n";

    private static final Set<String> DIFF_EXCLUDED_FIELDS = Set.of(
        "interviewStages", "createdAt", "updatedAt", "id"
    );

    private final ApplicationRepository applicationRepository;
    private final InterviewStageRepository stageRepository;
    private final ApplicationSnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public ApplicationService(
        ApplicationRepository applicationRepository,
        InterviewStageRepository stageRepository,
        ApplicationSnapshotRepository snapshotRepository,
        ObjectMapper objectMapper,
        PlatformTransactionManager transactionManager
    ) {
        this.applicationRepository = applicationRepository;
        this.stageRepository = stageRepository;
        this.snapshotRepository = snapshotRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
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
        applicationRepository.saveAndFlush(app);
        captureSnapshot(app, "Created application");
        return toResponse(app);
    }

    public ApplicationResponse update(UUID id, ApplicationRequest req) {
        Application app = findById(id);
        ApplicationStatus prevStatus = app.getStatus();
        applyRequest(app, req);
        syncDateApplied(app, prevStatus);

        if (shouldCreateDefaultStages(app, prevStatus)) {
            createDefaultStages(app);
        }

        applicationRepository.saveAndFlush(app);
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
        applicationRepository.saveAndFlush(app);
        captureSnapshot(app, "Archived");
        return toResponse(app);
    }

    public ApplicationResponse restore(UUID id) {
        Application app = findById(id);
        app.setArchived(false);
        applicationRepository.saveAndFlush(app);
        captureSnapshot(app, "Restored from archive");
        return toResponse(app);
    }

    public ApplicationResponse addStage(UUID appId, InterviewStageRequest req) {
        Application app = findById(appId);
        InterviewStage stage = new InterviewStage();
        stage.setApplication(app);
        applyStageRequest(stage, req);
        app.getInterviewStages().add(stage);
        applicationRepository.saveAndFlush(app);
        captureSnapshot(app, "Stage added");
        return toResponse(app);
    }

    public ApplicationResponse updateStage(UUID appId, UUID stageId, InterviewStageRequest req) {
        Application app = findById(appId);
        InterviewStage stage = app.getInterviewStages().stream()
            .filter(s -> s.getId().equals(stageId))
            .findFirst()
            .orElseThrow(() -> new EntityNotFoundException("Stage not found"));
        applyStageRequest(stage, req);
        applicationRepository.saveAndFlush(app);
        captureSnapshot(app, "Stage updated");
        return toResponse(app);
    }

    public ApplicationResponse deleteStage(UUID appId, UUID stageId) {
        Application app = findById(appId);
        app.getInterviewStages().removeIf(s -> s.getId().equals(stageId));
        applicationRepository.saveAndFlush(app);
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
            ApplicationResponse data = objectMapper.readValue(snapshot.getData(), ApplicationResponse.class);
            applySnapshot(app, data);
            applicationRepository.saveAndFlush(app);
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
        sb.append(CSV_HEADER);
        for (Application app : apps) {
            sb.append(toCsvRow(app));
        }
        return sb.toString();
    }

    public String getSampleCsv() {
        return CSV_HEADER
            + "Acme Corp,Software Engineer,applied,2024-01-15,https://acme.com,https://acme.com/jobs/123,,ai,8,linkedin,120000,160000,false,,Java Spring experience preferred,Great team culture\n";
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ImportResult importCsv(String csvContent) {
        List<String[]> rows = parseCsvContent(csvContent);
        int imported = 0;
        int skipped = 0;
        List<ImportError> errors = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        if (rows.isEmpty()) return new ImportResult(imported, skipped, errors);

        // Parse header row to determine column positions dynamically
        Map<String, Integer> headerMap = buildHeaderMap(rows.get(0));

        for (int i = 1; i < rows.size(); i++) {
            String[] cols = rows.get(i);
            int rowNum = i + 1;
            try {
                if (cols.length < 2) {
                    errors.add(new ImportError(rowNum, "Insufficient columns"));
                    continue;
                }
                String companyName = getCol(headerMap, cols, "companyName");
                String positionTitle = getCol(headerMap, cols, "positionTitle");
                String jobPostingUrl = getCol(headerMap, cols, "jobPostingUrl");

                if (companyName.isEmpty()) {
                    errors.add(new ImportError(rowNum, "Company name is required"));
                    continue;
                }
                if (positionTitle.isEmpty()) {
                    errors.add(new ImportError(rowNum, "Position title is required"));
                    continue;
                }

                if (!jobPostingUrl.isEmpty()) {
                    if (seenUrls.contains(jobPostingUrl) || applicationRepository.existsByJobPostingUrl(jobPostingUrl)) {
                        skipped++;
                        continue;
                    }
                    seenUrls.add(jobPostingUrl);
                }

                Application app = buildApplicationFromRow(headerMap, cols, companyName, positionTitle, jobPostingUrl);
                try {
                    transactionTemplate.executeWithoutResult(txStatus -> {
                        applicationRepository.saveAndFlush(app);
                        captureSnapshot(app, "Imported from CSV");
                    });
                    imported++;
                } catch (Exception e) {
                    errors.add(new ImportError(rowNum, e.getMessage()));
                }
            } catch (Exception e) {
                errors.add(new ImportError(rowNum, e.getMessage()));
            }
        }
        return new ImportResult(imported, skipped, errors);
    }

    private String getCol(Map<String, Integer> headerMap, String[] cols, String name) {
        Integer idx = headerMap.get(name);
        return (idx != null && idx < cols.length) ? cols[idx].trim() : "";
    }

    private List<String[]> parseCsvContent(String content) {
        List<String[]> rows = new ArrayList<>();
        List<String> currentRow = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < content.length() && content.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                currentRow.add(current.toString());
                current = new StringBuilder();
            } else if (c == '\r' && !inQuotes) {
                if (i + 1 < content.length() && content.charAt(i + 1) == '\n') {
                    i++;
                }
                currentRow.add(current.toString());
                current = new StringBuilder();
                if (!(currentRow.size() == 1 && currentRow.get(0).isEmpty())) {
                    rows.add(currentRow.toArray(new String[0]));
                }
                currentRow = new ArrayList<>();
            } else if (c == '\n' && !inQuotes) {
                currentRow.add(current.toString());
                current = new StringBuilder();
                if (!(currentRow.size() == 1 && currentRow.get(0).isEmpty())) {
                    rows.add(currentRow.toArray(new String[0]));
                }
                currentRow = new ArrayList<>();
            } else {
                current.append(c);
            }
        }
        // Handle trailing content without newline
        if (!currentRow.isEmpty() || current.length() > 0) {
            currentRow.add(current.toString());
            if (!(currentRow.size() == 1 && currentRow.get(0).isEmpty())) {
                rows.add(currentRow.toArray(new String[0]));
            }
        }
        return rows;
    }

    private Application findById(UUID id) {
        return applicationRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Application not found: " + id));
    }

    private void applyRequest(Application app, ApplicationRequest req) {
        app.setCompanyName(req.companyName());
        app.setPositionTitle(req.positionTitle());
        if (req.status() != null) {
            app.setStatus(ApplicationStatus.fromValue(req.status()));
        }
        app.setDateApplied(req.dateApplied());
        app.setCompanyUrl(req.companyUrl());
        app.setJobPostingUrl(req.jobPostingUrl());
        app.setCompanyCareerUrl(req.companyCareerUrl());
        app.setCompanyCategory(req.companyCategory() != null && !req.companyCategory().isBlank()
            ? CompanyCategory.fromValue(req.companyCategory()) : null);
        app.setSkillsMatch(req.skillsMatch());
        app.setJobSource(req.jobSource() != null && !req.jobSource().isBlank()
            ? JobSource.fromValue(req.jobSource()) : null);
        app.setSalaryMin(req.salaryMin());
        app.setSalaryMax(req.salaryMax());
        app.setCoverLetterRequired(req.coverLetterRequired());
        app.setOfferDueDate(req.offerDueDate());
        app.setSpecialRequirements(req.specialRequirements());
        app.setNotes(req.notes());
    }

    private void applyStageRequest(InterviewStage stage, InterviewStageRequest req) {
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
    }

    private void syncDateApplied(Application app, ApplicationStatus prevStatus) {
        if (prevStatus == ApplicationStatus.UNSUBMITTED
            && app.getStatus() != ApplicationStatus.UNSUBMITTED
            && app.getDateApplied() == null) {
            app.setDateApplied(LocalDate.now());
        }
        if (app.getStatus() == ApplicationStatus.UNSUBMITTED) {
            app.setDateApplied(null);
        }
    }

    private void applySnapshot(Application app, ApplicationResponse data) {
        app.setCompanyName(data.companyName());
        app.setPositionTitle(data.positionTitle());
        app.setStatus(ApplicationStatus.fromValue(data.status()));
        app.setDateApplied(data.dateApplied());
        app.setCompanyUrl(data.companyUrl());
        app.setJobPostingUrl(data.jobPostingUrl());
        app.setCompanyCareerUrl(data.companyCareerUrl());
        app.setCompanyCategory(data.companyCategory() != null
            ? CompanyCategory.fromValue(data.companyCategory()) : null);
        app.setSkillsMatch(data.skillsMatch());
        app.setJobSource(data.jobSource() != null
            ? JobSource.fromValue(data.jobSource()) : null);
        app.setSalaryMin(data.salaryMin());
        app.setSalaryMax(data.salaryMax());
        app.setCoverLetterRequired(data.coverLetterRequired());
        app.setOfferDueDate(data.offerDueDate());
        app.setSpecialRequirements(data.specialRequirements());
        app.setNotes(data.notes());
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
        ApplicationSnapshot prev = snapshotRepository
            .findFirstByApplicationIdAndSequenceNumberLessThanOrderBySequenceNumberDesc(
                snap.getApplicationId(), snap.getSequenceNumber())
            .orElse(null);
        if (prev == null) return List.of();
        try {
            Map<String, Object> current = objectMapper.readValue(snap.getData(), new TypeReference<>() {});
            Map<String, Object> previous = objectMapper.readValue(prev.getData(), new TypeReference<>() {});
            List<HistoryDiff> diffs = new ArrayList<>();
            for (String key : current.keySet()) {
                if (DIFF_EXCLUDED_FIELDS.contains(key)) continue;
                Object currVal = current.get(key);
                Object prevVal = previous.get(key);
                String currStr = currVal != null ? currVal.toString() : null;
                String prevStr = prevVal != null ? prevVal.toString() : null;
                if (!Objects.equals(currStr, prevStr)) {
                    diffs.add(new HistoryDiff(key, fieldToLabel(key), prevStr, currStr));
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

    private String toCsvRow(Application app) {
        return csvEscape(app.getCompanyName()) + ","
            + csvEscape(app.getPositionTitle()) + ","
            + csvEscape(app.getStatus().getValue()) + ","
            + csvEscape(app.getDateApplied() != null ? app.getDateApplied().toString() : "") + ","
            + csvEscape(app.getCompanyUrl()) + ","
            + csvEscape(app.getJobPostingUrl()) + ","
            + csvEscape(app.getCompanyCareerUrl()) + ","
            + csvEscape(app.getCompanyCategory() != null ? app.getCompanyCategory().getValue() : "") + ","
            + (app.getSkillsMatch() != null ? app.getSkillsMatch() : "") + ","
            + csvEscape(app.getJobSource() != null ? app.getJobSource().getValue() : "") + ","
            + (app.getSalaryMin() != null ? app.getSalaryMin() : "") + ","
            + (app.getSalaryMax() != null ? app.getSalaryMax() : "") + ","
            + (app.getCoverLetterRequired() != null ? app.getCoverLetterRequired() : "") + ","
            + csvEscape(app.getOfferDueDate() != null ? app.getOfferDueDate().toString() : "") + ","
            + csvEscape(app.getSpecialRequirements()) + ","
            + csvEscape(app.getNotes()) + "\n";
    }

    private Application buildApplicationFromRow(Map<String, Integer> headerMap, String[] cols,
                                                String companyName, String positionTitle, String jobPostingUrl) {
        Application app = new Application();
        app.setCompanyName(companyName);
        app.setPositionTitle(positionTitle);
        parseOptionalEnum(headerMap, cols, "status", ApplicationStatus::fromValue).ifPresent(app::setStatus);
        parseOptionalDate(headerMap, cols, "dateApplied").ifPresent(app::setDateApplied);
        setIfNotBlank(getCol(headerMap, cols, "companyUrl"), app::setCompanyUrl);
        setIfNotBlank(jobPostingUrl, app::setJobPostingUrl);
        setIfNotBlank(getCol(headerMap, cols, "companyCareerUrl"), app::setCompanyCareerUrl);
        parseOptionalEnum(headerMap, cols, "companyCategory", CompanyCategory::fromValue).ifPresent(app::setCompanyCategory);
        parseOptionalInt(headerMap, cols, "skillsMatch").ifPresent(app::setSkillsMatch);
        parseOptionalEnum(headerMap, cols, "jobSource", JobSource::fromValue).ifPresent(app::setJobSource);
        parseOptionalInt(headerMap, cols, "salaryMin").ifPresent(app::setSalaryMin);
        parseOptionalInt(headerMap, cols, "salaryMax").ifPresent(app::setSalaryMax);
        String coverLetterVal = getCol(headerMap, cols, "coverLetterRequired");
        if (!coverLetterVal.isEmpty()) app.setCoverLetterRequired(Boolean.parseBoolean(coverLetterVal));
        parseOptionalDate(headerMap, cols, "offerDueDate").ifPresent(app::setOfferDueDate);
        setIfNotBlank(getCol(headerMap, cols, "specialRequirements"), app::setSpecialRequirements);
        setIfNotBlank(getCol(headerMap, cols, "notes"), app::setNotes);
        return app;
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

    private boolean shouldCreateDefaultStages(Application app, ApplicationStatus prevStatus) {
        return prevStatus != ApplicationStatus.INTERVIEWING
            && app.getStatus() == ApplicationStatus.INTERVIEWING
            && app.getInterviewStages().isEmpty();
    }

    private Map<String, Integer> buildHeaderMap(String[] headers) {
        Map<String, Integer> headerMap = new HashMap<>();
        for (int j = 0; j < headers.length; j++) {
            headerMap.put(headers[j].trim(), j);
        }
        return headerMap;
    }

    private <E> Optional<E> parseOptionalEnum(Map<String, Integer> headerMap, String[] cols,
                                              String colName, Function<String, E> parser) {
        String val = getCol(headerMap, cols, colName);
        if (val.isEmpty()) return Optional.empty();
        try { return Optional.of(parser.apply(val)); } catch (Exception ignored) { return Optional.empty(); }
    }

    private Optional<Integer> parseOptionalInt(Map<String, Integer> headerMap, String[] cols, String colName) {
        String val = getCol(headerMap, cols, colName);
        if (val.isEmpty()) return Optional.empty();
        try { return Optional.of(Integer.parseInt(val)); } catch (NumberFormatException ignored) { return Optional.empty(); }
    }

    private Optional<LocalDate> parseOptionalDate(Map<String, Integer> headerMap, String[] cols, String colName) {
        String val = getCol(headerMap, cols, colName);
        if (val.isEmpty()) return Optional.empty();
        try { return Optional.of(LocalDate.parse(val)); } catch (Exception ignored) { return Optional.empty(); }
    }

    private void setIfNotBlank(String val, Consumer<String> setter) {
        if (!val.isEmpty()) setter.accept(val);
    }

}
