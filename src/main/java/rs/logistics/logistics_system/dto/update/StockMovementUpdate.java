package rs.logistics.logistics_system.dto.update;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementUpdate {

    private Long id;

    @NotNull
    @Size(min = 1, max = 30)
    private StockMovementType movementType;

    @NotNull
    @PositiveOrZero
    private BigDecimal quantity;

    @NotNull
    @Size(min = 1, max = 255)
    private String referenceNote;

    @NotNull
    private Long warehouseId;

    @NotNull
    private Long productId;

    @NotNull
    private Long createdById;

    public StockMovementUpdate(Long id, StockMovementType movementType,
                                 BigDecimal quantity,
                                 String referenceNote,
                                 Long warehouseId, Long productId, Long createdById) {
        this.id = id;
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceNote = referenceNote;
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.createdById = createdById;
    }
}
