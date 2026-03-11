package rs.logistics.logistics_system.dto.create;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementCreate {

    private StockMovementType movementType;
    private BigDecimal quantity;
    private String referenceNote;

    private Long warehouseId;
    private Long productId;
    private Long createdById;

    public StockMovementCreate(StockMovementType movementType,
                               BigDecimal quantity,
                               String referenceNote,
                               Long warehouseId, Long productId, Long createdById) {
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceNote = referenceNote;
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.createdById = createdById;
    }
}
