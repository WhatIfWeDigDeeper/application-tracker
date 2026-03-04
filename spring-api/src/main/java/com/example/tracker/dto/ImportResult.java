package com.example.tracker.dto;

import java.util.List;

public record ImportResult(int imported, int skipped, List<ImportError> errors) {}
