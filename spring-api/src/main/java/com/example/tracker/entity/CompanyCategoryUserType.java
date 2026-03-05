package com.example.tracker.entity;

public class CompanyCategoryUserType extends PostgreSQLEnumType<CompanyCategory> {

    public CompanyCategoryUserType() {
        super(CompanyCategory.class);
    }

    @Override
    protected String toDbValue(CompanyCategory value) {
        return value.getValue();
    }

    @Override
    protected CompanyCategory fromDbValue(String dbValue) {
        if (dbValue == null) return null;
        for (CompanyCategory c : CompanyCategory.values()) {
            if (c.getValue().equals(dbValue)) return c;
        }
        throw new IllegalArgumentException("Unknown company category: " + dbValue);
    }
}
