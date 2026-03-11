package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.entity.Product;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventoryCreate {

    private Long warehouseId;
    private Long productId;

    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal minStockLevel;


    public WarehouseInventoryCreate(BigDecimal quantity, BigDecimal reservedQuantity, BigDecimal minStockLevel, Long warehouseId, Long productId) {
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
        this.minStockLevel = minStockLevel;
    }
}
