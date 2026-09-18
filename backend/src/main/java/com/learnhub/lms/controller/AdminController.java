package com.learnhub.lms.controller;

import com.learnhub.lms.dto.response.AdminDashboardResponse;
import com.learnhub.lms.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only dashboard and management endpoints.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/stats")
    public AdminDashboardResponse getStatistics() {
        return adminDashboardService.getStatistics();
    }
}