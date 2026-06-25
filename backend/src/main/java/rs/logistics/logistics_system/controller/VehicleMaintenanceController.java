package rs.logistics.logistics_system.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCancel;
import rs.logistics.logistics_system.dto.create.VehicleMaintenanceCreate;
import rs.logistics.logistics_system.dto.response.DriverWorkloadResponse;
import rs.logistics.logistics_system.dto.response.PageResponse;
import rs.logistics.logistics_system.dto.response.VehicleMaintenanceResponse;
import rs.logistics.logistics_system.dto.update.VehicleMaintenanceUpdate;
import rs.logistics.logistics_system.enums.VehicleMaintenanceStatus;
import rs.logistics.logistics_system.service.definition.DriverWorkloadServiceDefinition;
import rs.logistics.logistics_system.service.definition.VehicleMaintenanceServiceDefinition;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/vehicle-maintenance")
@RequiredArgsConstructor
public class VehicleMaintenanceController {

    private final VehicleMaintenanceServiceDefinition vehicleMaintenanceService;
    private final DriverWorkloadServiceDefinition driverWorkloadService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PostMapping
    public ResponseEntity<VehicleMaintenanceResponse> create(@Valid @RequestBody VehicleMaintenanceCreate dto) {
        return new ResponseEntity<>(vehicleMaintenanceService.create(dto), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceResponse> update(@PathVariable Long id, @Valid @RequestBody VehicleMaintenanceUpdate dto) {
        return ResponseEntity.ok(vehicleMaintenanceService.update(id, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER')")
    @GetMapping("/{id}")
    public ResponseEntity<VehicleMaintenanceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleMaintenanceService.getById(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER','DRIVER')")
    @GetMapping
    public ResponseEntity<PageResponse<VehicleMaintenanceResponse>> getAll(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) VehicleMaintenanceStatus status,
            @PageableDefault(size = 20, sort = "scheduledAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(vehicleMaintenanceService.getAll(vehicleId, status, pageable));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/{id}/start")
    public ResponseEntity<VehicleMaintenanceResponse> start(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleMaintenanceService.start(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<VehicleMaintenanceResponse> complete(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleMaintenanceService.complete(id));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN')")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<VehicleMaintenanceResponse> cancel(@PathVariable Long id, @RequestBody(required = false) VehicleMaintenanceCancel dto) {
        return ResponseEntity.ok(vehicleMaintenanceService.cancel(id, dto));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/drivers/{employeeId}/workload")
    public ResponseEntity<DriverWorkloadResponse> getDriverWorkload(
            @PathVariable Long employeeId,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to
    ) {
        return ResponseEntity.ok(driverWorkloadService.getWorkload(employeeId, from, to));
    }
}
