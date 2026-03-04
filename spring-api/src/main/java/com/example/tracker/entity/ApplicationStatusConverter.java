package com.example.tracker.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ApplicationStatusConverter implements AttributeConverter<ApplicationStatus, String> {

    @Override
    public String convertToDatabaseColumn(ApplicationStatus status) {
        if (status == null) return null;
        return status.getValue();
    }

    @Override
    public ApplicationStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (ApplicationStatus s : ApplicationStatus.values()) {
            if (s.getValue().equals(dbData)) return s;
        }
        throw new IllegalArgumentException("Unknown application status: " + dbData);
    }
}
