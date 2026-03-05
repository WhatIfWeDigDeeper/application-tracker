package com.example.tracker.entity;

public class ApplicationStatusUserType extends PostgreSQLEnumType<ApplicationStatus> {

    public ApplicationStatusUserType() {
        super(ApplicationStatus.class);
    }

    @Override
    protected String toDbValue(ApplicationStatus value) {
        return value.getValue();
    }

    @Override
    protected ApplicationStatus fromDbValue(String dbValue) {
        if (dbValue == null) return null;
        for (ApplicationStatus s : ApplicationStatus.values()) {
            if (s.getValue().equals(dbValue)) return s;
        }
        throw new IllegalArgumentException("Unknown application status: " + dbValue);
    }
}
