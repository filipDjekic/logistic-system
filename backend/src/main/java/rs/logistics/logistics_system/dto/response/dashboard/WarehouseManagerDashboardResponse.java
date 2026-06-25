package rs.logistics.logistics_system.dto.response.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record WarehouseManagerDashboardResponse(
        long managedWarehousesTotal,
        long inventoryRowsTotal,
        long lowStockRowsTotal,
        BigDecimal inventoryQuantityTotal,
        BigDecimal inventoryReservedQuantityTotal,
        BigDecimal inventoryAvailableQuantityTotal,
        BigDecimal inventoryValueTotal,
        BigDecimal inventoryAverageUnitCost,
        String inventoryValuationCurrency,
        long stockMovementsTotal,
        long activeTransportOrdersAffectingWarehouses,
        long warehouseTasksTotal,
        long openWarehouseTasksTotal,
        Map<String, Long> warehouseTasksByStatus,
        List<WarehouseInventorySummaryResponse> warehouseInventorySummaries,
        List<LowStockItemResponse> lowStockItems,
        List<RecentStockMovementResponse> recentStockMovements,
        List<DashboardChartResponse> charts,
        List<DashboardAlertResponse> alerts
) {
    public record WarehouseInventorySummaryResponse(
            Long warehouseId,
            String warehouseName,
            long inventoryRowsTotal,
            long lowStockRowsTotal,
            BigDecimal quantityTotal,
            BigDecimal reservedQuantityTotal,
            BigDecimal availableQuantityTotal,
            BigDecimal totalValue,
            BigDecimal averageUnitCost,
            String currency
    ) {
    }

    public record LowStockItemResponse(
            Long warehouseId,
            String warehouseName,
            Long productId,
            String productName,
            BigDecimal quantity,
            BigDecimal reservedQuantity,
            BigDecimal availableQuantity,
            BigDecimal minStockLevel
    ) {
    }

    public record RecentStockMovementResponse(
            Long id,
            String movementType,
            BigDecimal quantity,
            String reasonCode,
            String referenceType,
            Long referenceId,
            String referenceNumber,
            LocalDateTime createdAt,
            Long warehouseId,
            String warehouseName,
            Long productId,
            String productName
    ) {
    }
}
