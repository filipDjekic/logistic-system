package rs.logistics.logistics_system.dto.response.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record InventoryReportResponse(
        LocalDateTime fromDate,
        LocalDateTime toDate,
        long inventoryRowsTotal,
        long lowStockRowsTotal,
        BigDecimal totalInventoryQuantity,
        BigDecimal totalAvailableQuantity,
        BigDecimal totalReservedQuantity,
        long stockMovementsTotal,
        BigDecimal inboundQuantity,
        BigDecimal outboundQuantity,
        BigDecimal transferQuantity,
        BigDecimal adjustmentQuantity,
        Map<String, Long> movementsByType,
        List<WarehouseInventorySummaryResponse> perWarehouse,
        List<ProductInventorySummaryResponse> perProduct,
        List<InventoryRowResponse> inventoryRows,
        List<StockMovementRowResponse> movementRows
) {
    public record WarehouseInventorySummaryResponse(
            Long warehouseId,
            String warehouseName,
            String city,
            long inventoryRows,
            long lowStockRows,
            BigDecimal quantity,
            BigDecimal availableQuantity,
            BigDecimal reservedQuantity,
            long stockMovements
    ) {
    }

    public record ProductInventorySummaryResponse(
            Long productId,
            String productName,
            String sku,
            String unit,
            long inventoryRows,
            long lowStockRows,
            BigDecimal quantity,
            BigDecimal availableQuantity,
            BigDecimal reservedQuantity,
            long stockMovements
    ) {
    }

    public record InventoryRowResponse(
            Long warehouseId,
            String warehouseName,
            Long productId,
            String productName,
            String sku,
            String unit,
            BigDecimal quantity,
            BigDecimal reservedQuantity,
            BigDecimal availableQuantity,
            BigDecimal minStockLevel,
            boolean lowStock,
            LocalDateTime lastUpdated
    ) {
    }

    public record StockMovementRowResponse(
            Long id,
            String movementType,
            BigDecimal quantity,
            String reasonCode,
            String referenceType,
            Long referenceId,
            String referenceNumber,
            Long warehouseId,
            String warehouseName,
            Long productId,
            String productName,
            String sku,
            LocalDateTime createdAt
    ) {
    }
}
