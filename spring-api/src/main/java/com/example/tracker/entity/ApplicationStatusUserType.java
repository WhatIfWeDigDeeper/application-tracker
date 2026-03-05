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
        return dbValue == null ? null : ApplicationStatus.fromValue(dbValue);
    }
}
