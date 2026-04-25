package rs.logistics.logistics_system.service.definition.report;

import java.time.LocalDateTime;

import rs.logistics.logistics_system.dto.response.report.TransportReportResponse;
import rs.logistics.logistics_system.enums.PriorityLevel;
import rs.logistics.logistics_system.enums.TransportOrderStatus;

public interface TransportReportServiceDefinition {

    TransportReportResponse getTransportReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            TransportOrderStatus status,
            PriorityLevel priority,
            Long sourceWarehouseId,
            Long destinationWarehouseId,
            Long vehicleId,
            Long assignedEmployeeId
    );
}
