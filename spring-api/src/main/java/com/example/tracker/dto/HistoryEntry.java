package com.example.tracker.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record HistoryEntry(
    UUID id,
    int sequence,
    String description,
    List<HistoryDiff> changes,
    OffsetDateTime createdAt
) {}
