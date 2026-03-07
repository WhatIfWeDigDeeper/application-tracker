package com.example.tracker.dto;

public record HistoryDiff(String field, String label, String oldValue, String newValue) {}
