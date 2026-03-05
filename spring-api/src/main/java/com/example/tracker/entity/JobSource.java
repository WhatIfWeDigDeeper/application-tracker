package com.example.tracker.entity;

public enum JobSource {
    RECRUITER("recruiter"),
    LINKEDIN("linkedin"),
    INDEED("indeed"),
    FRIEND("friend"),
    COLLEAGUE("colleague"),
    COMPANY_WEBSITE("company-website"),
    OTHER("other");

    private final String value;

    JobSource(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static JobSource fromValue(String v) {
        for (JobSource s : values()) {
            if (s.value.equals(v)) return s;
        }
        throw new IllegalArgumentException("Unknown source: " + v);
    }
}
