package rs.logistics.logistics_system.dto.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class WarehouseInventoryResponse {

    private Long warehouseId;
    private String warehouseName;
    private Long warehouseCompanyId;

    private Long productId;
    private String productName;
    private Long productCompanyId;

    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal minStockLevel;

    public WarehouseInventoryResponse(
            Long warehouseId,
            String warehouseName,
            Long warehouseCompanyId,
            Long productId,
            String productName,
            Long productCompanyId,
            BigDecimal quantity,
            BigDecimal reservedQuantity,
            BigDecimal availableQuantity,
            BigDecimal minStockLevel
    ) {
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
        this.warehouseCompanyId = warehouseCompanyId;
        this.productId = productId;
        this.productName = productName;
        this.productCompanyId = productCompanyId;
        this.quantity = quantity;
        this.reservedQuantity = reservedQuantity;
        this.availableQuantity = availableQuantity;
        this.minStockLevel = minStockLevel;
    }
}