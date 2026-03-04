package com.example.tracker.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class JobSourceConverter implements AttributeConverter<JobSource, String> {

    @Override
    public String convertToDatabaseColumn(JobSource source) {
        if (source == null) return null;
        return source.getValue();
    }

    @Override
    public JobSource convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (JobSource s : JobSource.values()) {
            if (s.getValue().equals(dbData)) return s;
        }
        throw new IllegalArgumentException("Unknown job source: " + dbData);
    }
}
