package com.example.tracker.controller;

import com.example.tracker.dto.ApplicationRequest;
import com.example.tracker.dto.ApplicationResponse;
import com.example.tracker.dto.HistoryEntry;
import com.example.tracker.dto.ImportResult;
import com.example.tracker.dto.InterviewStageRequest;
import com.example.tracker.dto.InterviewStageResponse;
import com.example.tracker.dto.PaginatedResponse;
import com.example.tracker.service.ApplicationService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService service;

    public ApplicationController(ApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public PaginatedResponse<ApplicationResponse> list(
        @RequestParam(required = false) List<String> status,
        @RequestParam(required = false) List<String> companyCategory,
        @RequestParam(required = false) List<String> jobSource,
        @RequestParam(required = false) Integer skillsMatchMin,
        @RequestParam(defaultValue = "false") boolean includeArchived,
        @RequestParam(defaultValue = "updatedAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return service.list(status, companyCategory, jobSource, skillsMatchMin,
            includeArchived, sortBy, sortDir, page, limit);
    }

    @GetMapping("/{id}")
    public ApplicationResponse get(@PathVariable @NonNull UUID id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(@Valid @RequestBody ApplicationRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }

    @PatchMapping("/{id}")
    public ApplicationResponse update(@PathVariable @NonNull UUID id, @Valid @RequestBody ApplicationRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/archive")
    public ApplicationResponse archive(@PathVariable @NonNull UUID id) {
        return service.archive(id);
    }

    @PostMapping("/{id}/restore")
    public ApplicationResponse restore(@PathVariable @NonNull UUID id) {
        return service.restore(id);
    }

    @PostMapping("/{id}/interview-stages")
    public ResponseEntity<InterviewStageResponse> addStage(@PathVariable @NonNull UUID id,
                                        @Valid @RequestBody InterviewStageRequest req) {
        return ResponseEntity.status(201).body(service.addStage(id, req));
    }

    @PatchMapping("/{id}/interview-stages/{stageId}")
    public InterviewStageResponse updateStage(@PathVariable @NonNull UUID id,
                                           @PathVariable @NonNull UUID stageId,
                                           @Valid @RequestBody InterviewStageRequest req) {
        return service.updateStage(id, stageId, req);
    }

    @DeleteMapping("/{id}/interview-stages/{stageId}")
    public ApplicationResponse deleteStage(@PathVariable @NonNull UUID id, @PathVariable @NonNull UUID stageId) {
        return service.deleteStage(id, stageId);
    }

    @GetMapping("/{id}/history")
    public List<HistoryEntry> getHistory(@PathVariable @NonNull UUID id) {
        return service.getHistory(id);
    }

    @PostMapping("/{id}/history/{historyId}/restore")
    public ApplicationResponse restoreHistory(@PathVariable @NonNull UUID id, @PathVariable @NonNull UUID historyId) {
        return service.restoreHistory(id, historyId);
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv() {
        String csv = service.exportCsv();
        String filename = "applications-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }

    @GetMapping("/sample-csv")
    public ResponseEntity<String> getSampleCsv() {
        String csv = service.getSampleCsv();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"applications-template.csv\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv);
    }

    @PostMapping("/import")
    public ImportResult importCsv(@RequestParam("file") MultipartFile file) throws IOException {
        String content = new String(file.getBytes());
        return service.importCsv(content);
    }
}
