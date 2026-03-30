package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.entity.Product;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventoryCreate {

    @NotNull
    @Positive
    private Long warehouseId;

    @NotNull
    @Positive
    private Long productId;

    @NotNull
    @PositiveOrZero
    private BigDecimal quantity;

    @NotNull
    @PositiveOrZero
    private BigDecimal minStockLevel;


    public WarehouseInventoryCreate(BigDecimal quantity, BigDecimal reservedQuantity, BigDecimal minStockLevel, Long warehouseId, Long productId) {
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.quantity = quantity;
        this.minStockLevel = minStockLevel;
    }
}
