package rs.logistics.logistics_system.dto.response.report;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InventoryValuationResponse(
        LocalDateTime generatedAt,
        BigDecimal totalInventoryValue,
        BigDecimal averageUnitCost,
        String currency,
        long inventoryRowsTotal,
        long valuedRowsTotal,
        List<WarehouseValuationResponse> perWarehouse,
        List<ProductValuationResponse> perProduct
) {
    public record WarehouseValuationResponse(
            Long warehouseId,
            String warehouseName,
            BigDecimal totalValue,
            BigDecimal quantity,
            BigDecimal averageUnitCost,
            String currency,
            long inventoryRows
    ) {
    }

    public record ProductValuationResponse(
            Long productId,
            String productName,
            String sku,
            BigDecimal totalValue,
            BigDecimal quantity,
            BigDecimal averageUnitCost,
            String currency,
            long inventoryRows
    ) {
    }
}
