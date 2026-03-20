package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventoryUpdate {

    @NotNull
    private Long warehouseId;

    @NotNull
    private Long productId;

    @NotNull
    @PositiveOrZero
    private BigDecimal quantity;

    @NotNull
    @PositiveOrZero
    private BigDecimal reservedQuantity;

    @NotNull
    @PositiveOrZero
    private BigDecimal minStockLevel;


    public WarehouseInventoryUpdate(BigDecimal quantity, BigDecimal reservedQuantity, BigDecimal minStockLevel, Long warehouseId, Long productId) {
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
        this.minStockLevel = minStockLevel;
    }
}
