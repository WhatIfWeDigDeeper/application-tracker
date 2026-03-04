package com.example.tracker.service;

import com.example.tracker.entity.Application;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;

public class ApplicationSpecifications {

    private ApplicationSpecifications() {}

    public static Specification<Application> hasStatus(List<String> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return null;
            return root.get("status").as(String.class).in(statuses);
        };
    }

    public static Specification<Application> hasCategory(List<String> categories) {
        return (root, query, cb) -> {
            if (categories == null || categories.isEmpty()) return null;
            return root.get("companyCategory").as(String.class).in(categories);
        };
    }

    public static Specification<Application> hasJobSource(List<String> sources) {
        return (root, query, cb) -> {
            if (sources == null || sources.isEmpty()) return null;
            return root.get("jobSource").as(String.class).in(sources);
        };
    }

    public static Specification<Application> hasMinSkillsMatch(Integer min) {
        return (root, query, cb) -> {
            if (min == null) return null;
            return cb.greaterThanOrEqualTo(root.get("skillsMatch"), min);
        };
    }

    public static Specification<Application> isArchived(boolean archived) {
        return (root, query, cb) -> cb.equal(root.get("archived"), archived);
    }
}
