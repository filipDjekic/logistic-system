package rs.logistics.logistics_system.dto.create;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.StockMovementReasonCode;
import rs.logistics.logistics_system.enums.StockMovementReferenceType;
import rs.logistics.logistics_system.enums.StockMovementType;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class StockMovementCreate {

    @NotNull
    private StockMovementType movementType;

    @NotNull
    @Positive
    private BigDecimal quantity;

    @NotNull
    private StockMovementReasonCode reasonCode;

    @Size(max = 255)
    private String reasonDescription;

    @NotNull
    private StockMovementReferenceType referenceType;

    private Long referenceId;

    @Size(max = 100)
    private String referenceNumber;

    @Size(max = 255)
    private String referenceNote;

    @Positive
    private Long transportOrderId;

    @NotNull
    @Positive
    private Long warehouseId;

    @NotNull
    @Positive
    private Long productId;

    public StockMovementCreate(
            StockMovementType movementType,
            BigDecimal quantity,
            StockMovementReasonCode reasonCode,
            String reasonDescription,
            StockMovementReferenceType referenceType,
            Long referenceId,
            String referenceNumber,
            String referenceNote,
            Long transportOrderId,
            Long warehouseId,
            Long productId
    ) {
        this.movementType = movementType;
        this.quantity = quantity;
        this.reasonCode = reasonCode;
        this.reasonDescription = reasonDescription;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.referenceNumber = referenceNumber;
        this.referenceNote = referenceNote;
        this.transportOrderId = transportOrderId;
        this.warehouseId = warehouseId;
        this.productId = productId;
    }
}