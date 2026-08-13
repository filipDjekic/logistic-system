package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;

public record StockMovementContextResponse(
        Long warehouseId,
        Long productId,
        Long binLocationId,
        BigDecimal availableQuantity,
        BigDecimal unitCost,
        String currency
) {
}
