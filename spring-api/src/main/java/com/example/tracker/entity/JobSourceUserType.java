package com.example.tracker.entity;

public class JobSourceUserType extends PostgreSQLEnumType<JobSource> {

    public JobSourceUserType() {
        super(JobSource.class);
    }

    @Override
    protected String toDbValue(JobSource value) {
        return value.getValue();
    }

    @Override
    protected JobSource fromDbValue(String dbValue) {
        return dbValue == null ? null : JobSource.fromValue(dbValue);
    }
}
