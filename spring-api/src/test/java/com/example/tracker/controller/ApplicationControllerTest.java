package com.example.tracker.controller;

import com.example.tracker.dto.ApplicationResponse;
import com.example.tracker.dto.PaginatedResponse;
import com.example.tracker.service.ApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ApplicationController.class)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ApplicationService service;

    private ApplicationResponse sampleApp() {
        return new ApplicationResponse(
            UUID.randomUUID(), "Acme", "Engineer", "applied",
            null, null, null, null, null,
            null, null, null, null, null,
            null, null, null, false, List.of(),
            OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void listReturnsOk() throws Exception {
        when(service.list(any(), any(), any(), any(), any(boolean.class), any(), any(), any(int.class), any(int.class)))
            .thenReturn(new PaginatedResponse<>(List.of(sampleApp()), 1, 20, 1L));
        mockMvc.perform(get("/api/applications"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void createReturnsBadRequestOnMissingFields() throws Exception {
        mockMvc.perform(post("/api/applications")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void createReturnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleApp());
        Map<String, String> req = Map.of("companyName", "Acme", "positionTitle", "Engineer");
        mockMvc.perform(post("/api/applications")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(req))))
            .andExpect(status().isCreated());
    }
}
