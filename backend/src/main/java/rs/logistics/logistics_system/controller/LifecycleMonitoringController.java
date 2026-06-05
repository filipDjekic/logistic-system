package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.LifecycleAnalyticsResponse;
import rs.logistics.logistics_system.service.definition.LifecycleMonitoringServiceDefinition;

@RestController
@RequestMapping("/api/lifecycle-monitoring")
@RequiredArgsConstructor
public class LifecycleMonitoringController {

    private final LifecycleMonitoringServiceDefinition lifecycleMonitoringService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','HR_MANAGER','DRIVER','WORKER')")
    @GetMapping
    public ResponseEntity<LifecycleAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(lifecycleMonitoringService.getAnalytics());
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PostMapping("/sweep")
    public ResponseEntity<LifecycleAnalyticsResponse> runSweep() {
        lifecycleMonitoringService.runMonitoringSweep();
        return ResponseEntity.ok(lifecycleMonitoringService.getAnalytics());
    }
}
