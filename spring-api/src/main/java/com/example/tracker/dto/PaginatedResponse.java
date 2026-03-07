package com.example.tracker.dto;

import java.util.List;

public record PaginatedResponse<T>(
    List<T> items,
    int page,
    int limit,
    long total
) {}
