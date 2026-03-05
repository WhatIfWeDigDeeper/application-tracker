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
        return dbValue == null ? null : CompanyCategory.fromValue(dbValue);
    }
}
