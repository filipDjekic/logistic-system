package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.CompanyAdminDashboardResponse;
import rs.logistics.logistics_system.dto.response.DispatcherDashboardResponse;
import rs.logistics.logistics_system.dto.response.DriverDashboardResponse;
import rs.logistics.logistics_system.dto.response.HrManagerDashboardResponse;
import rs.logistics.logistics_system.dto.response.OverlordDashboardResponse;
import rs.logistics.logistics_system.dto.response.WarehouseManagerDashboardResponse;
import rs.logistics.logistics_system.dto.response.WorkerDashboardResponse;
import rs.logistics.logistics_system.service.definition.CompanyAdminDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.DispatcherDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.DriverDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.HrManagerDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.OverlordDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.WarehouseManagerDashboardServiceDefinition;
import rs.logistics.logistics_system.service.definition.WorkerDashboardServiceDefinition;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final OverlordDashboardServiceDefinition overlordDashboardService;
    private final CompanyAdminDashboardServiceDefinition companyAdminDashboardService;
    private final HrManagerDashboardServiceDefinition hrManagerDashboardService;
    private final WarehouseManagerDashboardServiceDefinition warehouseManagerDashboardService;
    private final DispatcherDashboardServiceDefinition dispatcherDashboardService;
    private final DriverDashboardServiceDefinition driverDashboardService;
    private final WorkerDashboardServiceDefinition workerDashboardService;

    @PreAuthorize("hasRole('OVERLORD')")
    @GetMapping("/overlord")
    public ResponseEntity<OverlordDashboardResponse> getOverlordDashboard() {
        return ResponseEntity.ok(overlordDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    @GetMapping("/company-admin")
    public ResponseEntity<CompanyAdminDashboardResponse> getCompanyAdminDashboard() {
        return ResponseEntity.ok(companyAdminDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('HR_MANAGER')")
    @GetMapping("/hr-manager")
    public ResponseEntity<HrManagerDashboardResponse> getHrManagerDashboard() {
        return ResponseEntity.ok(hrManagerDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('WAREHOUSE_MANAGER')")
    @GetMapping("/warehouse-manager")
    public ResponseEntity<WarehouseManagerDashboardResponse> getWarehouseManagerDashboard() {
        return ResponseEntity.ok(warehouseManagerDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('DISPATCHER')")
    @GetMapping("/dispatcher")
    public ResponseEntity<DispatcherDashboardResponse> getDispatcherDashboard() {
        return ResponseEntity.ok(dispatcherDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('DRIVER')")
    @GetMapping("/driver")
    public ResponseEntity<DriverDashboardResponse> getDriverDashboard() {
        return ResponseEntity.ok(driverDashboardService.getOverview());
    }

    @PreAuthorize("hasRole('WORKER')")
    @GetMapping("/worker")
    public ResponseEntity<WorkerDashboardResponse> getWorkerDashboard() {
        return ResponseEntity.ok(workerDashboardService.getOverview());
    }
}
