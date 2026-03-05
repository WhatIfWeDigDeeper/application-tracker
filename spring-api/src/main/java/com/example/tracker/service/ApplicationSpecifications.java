package com.example.tracker.service;

import com.example.tracker.entity.Application;
import com.example.tracker.entity.ApplicationStatus;
import com.example.tracker.entity.CompanyCategory;
import com.example.tracker.entity.JobSource;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;

public class ApplicationSpecifications {

    private ApplicationSpecifications() {}

    public static Specification<Application> hasStatus(List<String> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return null;
            List<ApplicationStatus> enumValues = parseEnumValues(statuses, ApplicationStatus::fromValue);
            if (enumValues.isEmpty()) return cb.disjunction();
            return root.get("status").in(enumValues);
        };
    }

    public static Specification<Application> hasCategory(List<String> categories) {
        return (root, query, cb) -> {
            if (categories == null || categories.isEmpty()) return null;
            List<CompanyCategory> enumValues = parseEnumValues(categories, CompanyCategory::fromValue);
            if (enumValues.isEmpty()) return cb.disjunction();
            return root.get("companyCategory").in(enumValues);
        };
    }

    public static Specification<Application> hasJobSource(List<String> sources) {
        return (root, query, cb) -> {
            if (sources == null || sources.isEmpty()) return null;
            List<JobSource> enumValues = parseEnumValues(sources, JobSource::fromValue);
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

    private static <E> List<E> parseEnumValues(List<String> raw, Function<String, E> fromValue) {
        return raw.stream()
            .map(s -> {
                try { return fromValue.apply(s); }
                catch (IllegalArgumentException e) { return null; }
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
}
