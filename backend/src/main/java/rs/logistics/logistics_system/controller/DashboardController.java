package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.OverlordDashboardResponse;
import rs.logistics.logistics_system.service.definition.OverlordDashboardServiceDefinition;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final OverlordDashboardServiceDefinition overlordDashboardService;

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/overlord")
    public ResponseEntity<OverlordDashboardResponse> getOverlordDashboard() {
        return ResponseEntity.ok(overlordDashboardService.getOverview());
    }
}
