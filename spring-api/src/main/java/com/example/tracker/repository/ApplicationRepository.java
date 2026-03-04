package com.example.tracker.repository;

import com.example.tracker.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID>,
        JpaSpecificationExecutor<Application> {
}
