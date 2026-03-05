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
        if (dbValue == null) return null;
        for (JobSource s : JobSource.values()) {
            if (s.getValue().equals(dbValue)) return s;
        }
        throw new IllegalArgumentException("Unknown job source: " + dbValue);
    }
}
