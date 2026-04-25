package rs.logistics.logistics_system.service.definition.report;

import rs.logistics.logistics_system.dto.response.report.InventoryReportResponse;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.time.LocalDateTime;

public interface InventoryReportServiceDefinition {

    InventoryReportResponse getInventoryReport(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Long warehouseId,
            Long productId,
            StockMovementType movementType
    );
}
