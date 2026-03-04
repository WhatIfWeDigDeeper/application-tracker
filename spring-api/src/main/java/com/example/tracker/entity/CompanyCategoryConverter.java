package com.example.tracker.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CompanyCategoryConverter implements AttributeConverter<CompanyCategory, String> {

    @Override
    public String convertToDatabaseColumn(CompanyCategory category) {
        if (category == null) return null;
        return category.getValue();
    }

    @Override
    public CompanyCategory convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        for (CompanyCategory c : CompanyCategory.values()) {
            if (c.getValue().equals(dbData)) return c;
        }
        throw new IllegalArgumentException("Unknown company category: " + dbData);
    }
}
