package rs.logistics.logistics_system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import rs.logistics.logistics_system.dto.response.report.EmployeeTaskReportResponse;
import rs.logistics.logistics_system.dto.response.report.InventoryReportResponse;
import rs.logistics.logistics_system.dto.response.report.TransportReportResponse;
import rs.logistics.logistics_system.enums.EmployeePosition;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.StockMovementType;
import rs.logistics.logistics_system.enums.TaskPriority;
import rs.logistics.logistics_system.enums.TaskStatus;
import rs.logistics.logistics_system.enums.TransportOrderStatus;
import rs.logistics.logistics_system.service.definition.report.EmployeeTaskReportServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.InventoryReportServiceDefinition;
import rs.logistics.logistics_system.service.definition.report.TransportReportServiceDefinition;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final TransportReportServiceDefinition transportReportService;
    private final InventoryReportServiceDefinition inventoryReportService;
    private final EmployeeTaskReportServiceDefinition employeeTaskReportService;

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping("/transport")
    public ResponseEntity<TransportReportResponse> getTransportReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) TransportOrderStatus status,
            @RequestParam(required = false) PriorityLevel priority,
            @RequestParam(required = false) Long sourceWarehouseId,
            @RequestParam(required = false) Long destinationWarehouseId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long assignedEmployeeId
    ) {
        return ResponseEntity.ok(transportReportService.getTransportReport(
                fromDate,
                toDate,
                status,
                priority,
                sourceWarehouseId,
                destinationWarehouseId,
                vehicleId,
                assignedEmployeeId
        ));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','DISPATCHER','WAREHOUSE_MANAGER')")
    @GetMapping(value = "/transport/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportTransportReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) TransportOrderStatus status,
            @RequestParam(required = false) PriorityLevel priority,
            @RequestParam(required = false) Long sourceWarehouseId,
            @RequestParam(required = false) Long destinationWarehouseId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long assignedEmployeeId
    ) {
        byte[] csv = transportReportService.exportTransportReportCsv(
                fromDate,
                toDate,
                status,
                priority,
                sourceWarehouseId,
                destinationWarehouseId,
                vehicleId,
                assignedEmployeeId
        );
        return csvResponse(csv, "transport-report.csv");
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportResponse> getInventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType movementType
    ) {
        return ResponseEntity.ok(inventoryReportService.getInventoryReport(
                fromDate,
                toDate,
                warehouseId,
                productId,
                movementType
        ));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping(value = "/inventory/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportInventoryReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) StockMovementType movementType
    ) {
        byte[] csv = inventoryReportService.exportInventoryReportCsv(
                fromDate,
                toDate,
                warehouseId,
                productId,
                movementType
        );
        return csvResponse(csv, "inventory-report.csv");
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @GetMapping("/employee-tasks")
    public ResponseEntity<EmployeeTaskReportResponse> getEmployeeTaskReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) EmployeePosition position,
            @RequestParam(required = false) TaskStatus taskStatus,
            @RequestParam(required = false) TaskPriority taskPriority
    ) {
        return ResponseEntity.ok(employeeTaskReportService.getEmployeeTaskReport(
                fromDate,
                toDate,
                employeeId,
                position,
                taskStatus,
                taskPriority
        ));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','HR_MANAGER')")
    @GetMapping(value = "/employee-tasks/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportEmployeeTaskReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) EmployeePosition position,
            @RequestParam(required = false) TaskStatus taskStatus,
            @RequestParam(required = false) TaskPriority taskPriority
    ) {
        byte[] csv = employeeTaskReportService.exportEmployeeTaskReportCsv(
                fromDate,
                toDate,
                employeeId,
                position,
                taskStatus,
                taskPriority
        );
        return csvResponse(csv, "employee-task-report.csv");
    }

    private ResponseEntity<byte[]> csvResponse(byte[] csv, String fileName) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(csv.length)
                .body(csv);
    }
}
