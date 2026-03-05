package com.example.tracker.service;

import com.example.tracker.entity.Application;
import com.example.tracker.entity.ApplicationStatus;
import com.example.tracker.entity.CompanyCategory;
import com.example.tracker.entity.JobSource;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;
import java.util.stream.Collectors;

public class ApplicationSpecifications {

    private ApplicationSpecifications() {}

    public static Specification<Application> hasStatus(List<String> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return null;
            List<ApplicationStatus> enumValues = statuses.stream()
                .map(s -> {
                    for (ApplicationStatus v : ApplicationStatus.values()) {
                        if (v.getValue().equals(s)) return v;
                    }
                    return null;
                })
                .filter(v -> v != null)
                .collect(Collectors.toList());
            if (enumValues.isEmpty()) return cb.disjunction();
            return root.get("status").in(enumValues);
        };
    }

    public static Specification<Application> hasCategory(List<String> categories) {
        return (root, query, cb) -> {
            if (categories == null || categories.isEmpty()) return null;
            List<CompanyCategory> enumValues = categories.stream()
                .map(s -> {
                    for (CompanyCategory v : CompanyCategory.values()) {
                        if (v.getValue().equals(s)) return v;
                    }
                    return null;
                })
                .filter(v -> v != null)
                .collect(Collectors.toList());
            if (enumValues.isEmpty()) return cb.disjunction();
            return root.get("companyCategory").in(enumValues);
        };
    }

    public static Specification<Application> hasJobSource(List<String> sources) {
        return (root, query, cb) -> {
            if (sources == null || sources.isEmpty()) return null;
            List<JobSource> enumValues = sources.stream()
                .map(s -> {
                    for (JobSource v : JobSource.values()) {
                        if (v.getValue().equals(s)) return v;
                    }
                    return null;
                })
                .filter(v -> v != null)
                .collect(Collectors.toList());
            if (enumValues.isEmpty()) return cb.disjunction();
            return root.get("jobSource").in(enumValues);
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
