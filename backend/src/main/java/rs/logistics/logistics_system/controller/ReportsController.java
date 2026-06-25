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
import rs.logistics.logistics_system.dto.response.report.InventoryValuationResponse;
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

import java.nio.charset.StandardCharsets;
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
            @RequestParam(required = false) Long assignedEmployeeId,
            @RequestParam(defaultValue = "CSV") String format
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
        return exportResponse(csv, "transport-report", format);
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
            @RequestParam(required = false) StockMovementType movementType,
            @RequestParam(defaultValue = "CSV") String format
    ) {
        byte[] csv = inventoryReportService.exportInventoryReportCsv(
                fromDate,
                toDate,
                warehouseId,
                productId,
                movementType
        );
        return exportResponse(csv, "inventory-report", format);
    }


    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping("/inventory/valuation")
    public ResponseEntity<InventoryValuationResponse> getInventoryValuationReport(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId
    ) {
        return ResponseEntity.ok(inventoryReportService.getInventoryValuationReport(warehouseId, productId));
    }

    @PreAuthorize("hasAnyRole('OVERLORD','COMPANY_ADMIN','WAREHOUSE_MANAGER')")
    @GetMapping(value = "/inventory/valuation/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportInventoryValuationReport(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "CSV") String format
    ) {
        byte[] csv = inventoryReportService.exportInventoryValuationCsv(warehouseId, productId);
        return exportResponse(csv, "inventory-valuation-report", format);
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
            @RequestParam(required = false) TaskPriority taskPriority,
            @RequestParam(defaultValue = "CSV") String format
    ) {
        byte[] csv = employeeTaskReportService.exportEmployeeTaskReportCsv(
                fromDate,
                toDate,
                employeeId,
                position,
                taskStatus,
                taskPriority
        );
        return exportResponse(csv, "employee-task-report", format);
    }

    private ResponseEntity<byte[]> exportResponse(byte[] csv, String baseFileName, String format) {
        if ("XLSX".equalsIgnoreCase(format)) {
            byte[] workbook = toSpreadsheetXml(csv);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseFileName + ".xlsx\"")
                    .contentLength(workbook.length)
                    .body(workbook);
        }

        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + baseFileName + ".csv\"")
                .contentLength(csv.length)
                .body(csv);
    }

    private byte[] toSpreadsheetXml(byte[] csv) {
        String csvText = new String(csv, StandardCharsets.UTF_8).replace("\uFEFF", "");
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\"?>");
        xml.append("<?mso-application progid=\"Excel.Sheet\"?>");
        xml.append("<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" ");
        xml.append("xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\"><Worksheet ss:Name=\"Report\"><Table>");
        for (String line : csvText.split("\\n")) {
            xml.append("<Row>");
            for (String cell : line.split(",", -1)) {
                xml.append("<Cell><Data ss:Type=\"String\">").append(escapeXml(cell.replace("\"", ""))).append("</Data></Cell>");
            }
            xml.append("</Row>");
        }
        xml.append("</Table></Worksheet></Workbook>");
        return xml.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeXml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
