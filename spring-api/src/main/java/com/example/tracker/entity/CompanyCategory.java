package com.example.tracker.entity;

public enum CompanyCategory {
    EDUCATION("education"),
    HEALTH("health"),
    CLIMATE("climate"),
    AI("ai"),
    ENERGY("energy"),
    FINANCE("finance"),
    ENTERPRISE_SOFTWARE("enterprise-software"),
    CONSUMER_TECH("consumer-tech"),
    E_COMMERCE("e-commerce"),
    CYBERSECURITY("cybersecurity"),
    GAMING("gaming"),
    MEDIA_ENTERTAINMENT("media-entertainment"),
    CONSULTING("consulting"),
    GOVERNMENT("government"),
    NONPROFIT("nonprofit"),
    RETAIL("retail"),
    RESTAURANT("restaurant"),
    HOSPITALITY("hospitality"),
    OTHER("other");

    private final String value;

    CompanyCategory(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
