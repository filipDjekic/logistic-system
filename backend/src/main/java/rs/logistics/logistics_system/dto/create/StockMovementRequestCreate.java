package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockAdjustmentDirection;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementRequestCreate {
    @NotNull
    private StockMovementType movementType;

    @NotNull
    @Positive
    private BigDecimal quantity;

    private StockAdjustmentDirection adjustmentDirection;

    @Size(max = 255)
    private String reasonDescription;

    @NotNull
    @Positive
    private Long warehouseId;

    @Positive
    private Long destinationWarehouseId;

    @NotNull
    @Positive
    private Long productId;

    @Positive
    private Long binLocationId;

    @Positive
    private Long destinationBinLocationId;
}
