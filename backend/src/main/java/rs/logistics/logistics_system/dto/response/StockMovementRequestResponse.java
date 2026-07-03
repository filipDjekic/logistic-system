package rs.logistics.logistics_system.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementRequestStatus;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementRequestResponse {
    private Long id;
    private StockMovementType movementType;
    private StockMovementRequestStatus status;
    private BigDecimal quantity;
    private StockAdjustmentDirection adjustmentDirection;
    private String reasonDescription;
    private String reviewNote;
    private Long warehouseId;
    private String warehouseName;
    private Long destinationWarehouseId;
    private String destinationWarehouseName;
    private Long productId;
    private String productName;
    private Long binLocationId;
    private Long destinationBinLocationId;
    private Long requestedById;
    private Long reviewedById;
    private Long createdMovementId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
}
