package com.example.tracker.entity;

public enum ApplicationStatus {
    UNSUBMITTED("unsubmitted"),
    APPLIED("applied"),
    INTERVIEWING("interviewing"),
    GIVEN_OFFER("given offer"),
    ACCEPTED_OFFER("accepted offer"),
    DECLINED_OFFER("declined offer"),
    REJECTED("rejected"),
    NO_OFFER("no offer");

    private final String value;

    ApplicationStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
